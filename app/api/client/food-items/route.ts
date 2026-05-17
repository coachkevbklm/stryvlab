import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

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

// GET /api/client/food-items?category=proteins&subcategory=viandes&q=poulet&limit=50&mine=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const subcategory = searchParams.get("subcategory")
  const q = searchParams.get("q")?.trim()
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
  const mineOnly = searchParams.get("mine") === "true"

  const db = service()

  // For "mine" filter, need clientId
  let clientId: string | null = null
  if (mineOnly) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    clientId = await resolveClientId(user.id)
  }

  let query = db
    .from("food_items")
    .select("id, name_fr, category_l1, category_l2, item_key, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, client_id")
    .order("name_fr")
    .limit(limit)

  if (mineOnly && clientId) {
    query = query.eq("client_id", clientId)
  } else {
    // Default: internal + user's own custom items
    // is_verified filter only on internal items
    if (!q) query = query.eq("is_verified", true)
  }

  if (category) query = query.eq("category_l1", category)
  if (subcategory) query = query.eq("category_l2", subcategory)
  if (q) query = query.ilike("name_fr", `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
}

const createCustomSchema = z.object({
  name_fr: z.string().min(1).max(100),
  category_l1: z.enum(["proteins", "carbs", "vegetables", "fruits", "fats", "drinks", "extras"]),
  category_l2: z.string().max(50).nullable().optional(),
  kcal_per_100g: z.number().min(0).max(900),
  protein_per_100g: z.number().min(0).max(100),
  carbs_per_100g: z.number().min(0).max(100),
  fat_per_100g: z.number().min(0).max(100),
  fiber_per_100g: z.number().min(0).max(100).default(0),
})

// POST /api/client/food-items — créer un aliment personnalisé
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = await resolveClientId(user.id)
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const body = createCustomSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { name_fr, category_l1, category_l2, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g } = body.data

  // Slug stable : nom normalisé + client_id suffix pour éviter les conflits
  const slug = name_fr
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const item_key = `custom-${slug}-${clientId.slice(0, 8)}`

  const { data, error } = await service()
    .from("food_items")
    .insert({
      name_fr: name_fr.trim(),
      category_l1,
      category_l2: category_l2 ?? null,
      item_key,
      kcal_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      fiber_per_100g,
      source: "user",
      is_verified: false,
      client_id: clientId,
    })
    .select("id, name_fr, category_l1, category_l2, item_key, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet aliment existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// DELETE /api/client/food-items?id=xxx — supprimer un aliment personnalisé
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = await resolveClientId(user.id)
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await service()
    .from("food_items")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId) // ownership check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
