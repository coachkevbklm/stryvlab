import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import OpenAI from "openai"

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function resolveClientId(userId: string): Promise<string | null> {
  const { data } = await service()
    .from("coach_clients")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id ?? null
}

// ── In-memory rate limit (10 req/min per clientId) ───────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(clientId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const bodySchema = z.object({
  transcript: z.string().min(3).max(1000),
  physiological_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lang: z.enum(["fr", "en", "es"]).default("fr"),
  client_hour: z.number().int().min(0).max(23).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = await resolveClientId(user.id)
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "rate_limit", retry_after: 60 }, { status: 429 })
  }

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { transcript, lang, client_hour } = body.data
  const db = service()

  // ── Fetch top-20 food items this client uses most ─────────────────────────
  const { data: topEntries } = await db
    .from("nutrition_entries")
    .select("food_item_id, food_items(id, name_fr)")
    .eq("client_id", clientId)
    .limit(200)

  const countMap: Record<string, { id: string; name: string; count: number }> = {}
  for (const e of (topEntries ?? [])) {
    const fi = (e as any).food_items
    if (!fi) continue
    if (!countMap[fi.id]) countMap[fi.id] = { id: fi.id, name: fi.name_fr, count: 0 }
    countMap[fi.id].count++
  }
  const topFoods = Object.values(countMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(f => `${f.name} (id: ${f.id})`)

  const currentHour = client_hour ?? new Date().getHours() // prefer client local time
  const catalogHint = topFoods.length
    ? `Aliments fréquents du client (pour résolution d'ID uniquement — ne PAS s'en servir pour renommer un aliment du transcript) :\n${topFoods.join('\n')}`
    : ""

  // ── GPT-4o mini call ──────────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const systemPrompt = `Tu es un assistant nutritionnel. Extrais les aliments et quantités du transcript ci-dessous. Retourne UNIQUEMENT un JSON valide.

RÈGLE ABSOLUE — NOM DES ALIMENTS :
Utilise le nom tel qu'il est dit dans le transcript. Ne jamais renommer, paraphraser ni substituer.
- "beurre de baratte" → "Beurre de baratte" (PAS "beurre de cacahuète")
- "flocons d'avoine" → "Flocons d'avoine" (PAS "porridge")
- "riz basmati" → "Riz basmati" (PAS "riz blanc")
Exception UNIQUEMENT si le terme est un non-mot ou un nom de marque clairement déformé :
- "proutimuscle", "prunty", "nutrimuscle protimuscle" → "Whey protéine" (générique)
- Si la marque est reconnaissable (Danone, Activia, etc.), conserve-la.

Format JSON :
{
  "items": [
    {
      "name": "nom de l'aliment issu du transcript",
      "quantity_g": 150,
      "kcal": 248,
      "protein_g": 31.5,
      "carbs_g": 0,
      "fat_g": 13.2,
      "fiber_g": 0,
      "confidence": "high"
    }
  ],
  "meal_type": "lunch"
}

Autres règles :
- Identifie chaque aliment distinct mentionné
- Si quantité non précisée, estime une portion standard
- confidence: "high" si quantité ET aliment explicites, "medium" si estimés, "low" si très incertain
- meal_type : breakfast | lunch | dinner | snack — selon contexte ou heure (${currentHour}h)
- Valeurs nutritionnelles = pour la quantité indiquée (pas pour 100g)
- Ne retourne QUE le JSON

${catalogHint}`

  let parsed: { items: any[]; meal_type: string } | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcript vocal :\n${transcript}` },
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: "json_object" },
      })
      const raw = completion.choices[0]?.message?.content ?? ""
      parsed = JSON.parse(raw)
      break
    } catch {
      if (attempt === 1) {
        return NextResponse.json({ error: "parse_failed" }, { status: 422 })
      }
    }
  }

  if (!parsed || !Array.isArray(parsed.items)) {
    return NextResponse.json({ error: "parse_failed" }, { status: 422 })
  }

  // ── Match food_item_id from catalogue by name ─────────────────────────────
  const itemNames = parsed.items.map((i: any) => i.name as string)
  const { data: matchedFoods } = await db
    .from("food_items")
    .select("id, name_fr")
    .in("name_fr", itemNames)

  const nameToId: Record<string, string> = {}
  for (const f of (matchedFoods ?? [])) {
    nameToId[f.name_fr.toLowerCase()] = f.id
  }

  // Also pick up ids from top-20 cache
  const topIdByName: Record<string, string> = {}
  for (const entry of (topEntries ?? [])) {
    const fi = (entry as any).food_items
    if (fi) topIdByName[fi.name_fr.toLowerCase()] = fi.id
  }

  const voiceItems = parsed.items.map((item: any) => {
    const nameLower = (item.name as string).toLowerCase()
    const food_item_id = nameToId[nameLower] ?? topIdByName[nameLower]
    return {
      name: item.name as string,
      quantity_g: Number(item.quantity_g) || 100,
      kcal: Number(item.kcal) || 0,
      protein_g: Number(item.protein_g) || 0,
      carbs_g: Number(item.carbs_g) || 0,
      fat_g: Number(item.fat_g) || 0,
      fiber_g: Number(item.fiber_g) || 0,
      confidence: (item.confidence as string) || "medium",
      food_item_id,
      is_new: !food_item_id,
    }
  })

  const validMealTypes = ["breakfast", "lunch", "dinner", "snack"]
  const meal_type = validMealTypes.includes(parsed.meal_type) ? parsed.meal_type : "snack"

  return NextResponse.json({
    items: voiceItems,
    meal_type,
    raw_transcript: transcript,
    clean_transcript: transcript,
  })
}
