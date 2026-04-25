import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { ct, type ClientLang } from '@/lib/i18n/clientTranslations'
import { Utensils, Droplets } from 'lucide-react'

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total === 0) return null

  const pPct = (protein * 4) / total
  const cPct = (carbs * 4) / total
  const fPct = (fat * 9) / total

  const R = 40
  const CX = 50
  const CY = 50
  const circumference = 2 * Math.PI * R
  const gap = 2

  function arc(offset: number, pct: number, color: string) {
    const len = Math.max(0, pct * circumference - gap)
    return (
      <circle
        key={color}
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${len} ${circumference - len}`}
        strokeDashoffset={-offset * circumference}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
      {arc(0,          pPct, '#3b82f6')}
      {arc(pPct,       cPct, '#f59e0b')}
      {arc(pPct+cPct,  fPct, '#ef4444')}
    </svg>
  )
}

export default async function ClientNutritionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service, 'id, gender')

  const prefsRes = client
    ? await service.from('client_preferences').select('language').eq('client_id', client.id).maybeSingle()
    : { data: null }
  const rawLang = (prefsRes as any)?.data?.language
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? rawLang as ClientLang : 'fr'

  const isFemale = (client as any)?.gender === 'female'

  const { data: protocolData } = client
    ? await service
        .from('nutrition_protocols')
        .select('id, name, notes, nutrition_protocol_days(*)')
        .eq('client_id', client.id)
        .eq('status', 'shared')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const protocol = protocolData as any
  const days: any[] = protocol
    ? [...(protocol.nutrition_protocol_days ?? [])].sort((a: any, b: any) => a.position - b.position)
    : []

  if (!protocol) {
    return (
      <main className="min-h-screen bg-[#121212]">
        <div className="px-6 pb-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-5">
            {ct(lang, 'nutrition.section')}
          </p>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Utensils size={20} className="text-white/20" />
            </div>
            <p className="text-[13px] font-semibold text-white/30">
              {ct(lang, 'nutrition.noProtocol')}
            </p>
            <p className="text-[11px] text-white/20 mt-1">
              {ct(lang, 'nutrition.noProtocol.desc')}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24 space-y-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          {ct(lang, 'nutrition.section')}
        </p>

        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4">
          <p className="text-[13px] font-bold text-white mb-0.5">{protocol.name}</p>
          {protocol.notes && (
            <p className="text-[12px] text-white/40 mb-3">{protocol.notes}</p>
          )}
        </div>

        {days.map((day: any, i: number) => {
          const cal    = day.calories   ? Number(day.calories)   : null
          const prot   = day.protein_g  ? Number(day.protein_g)  : null
          const carbs  = day.carbs_g    ? Number(day.carbs_g)    : null
          const fat    = day.fat_g      ? Number(day.fat_g)      : null
          const hydml  = day.hydration_ml ? Number(day.hydration_ml) : null
          const hasMacros = prot !== null && carbs !== null && fat !== null

          return (
            <div key={day.id ?? i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{day.name}</p>

              {cal && (
                <div className="text-center">
                  <p className="text-[2rem] font-black text-white leading-none">{cal}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{ct(lang, 'nutrition.kcal')}</p>
                </div>
              )}

              {hasMacros && (
                <div className="flex items-center gap-4">
                  <MacroDonut protein={prot!} carbs={carbs!} fat={fat!} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        {ct(lang, 'nutrition.protein')}
                      </span>
                      <span className="text-[12px] font-bold text-white">{prot}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        {ct(lang, 'nutrition.carbs')}
                      </span>
                      <span className="text-[12px] font-bold text-white">{carbs}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        {ct(lang, 'nutrition.fat')}
                      </span>
                      <span className="text-[12px] font-bold text-white">{fat}g</span>
                    </div>
                  </div>
                </div>
              )}

              {day.carb_cycle_type && (
                <div className="bg-amber-500/[0.06] border-[0.3px] border-amber-500/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400/70 mb-0.5">
                    {ct(lang, 'nutrition.carbCycle')}
                  </p>
                  <p className="text-[12px] text-amber-300/80 font-medium capitalize">{day.carb_cycle_type}</p>
                </div>
              )}

              {hydml && (
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-blue-400/60 shrink-0" />
                  <p className="text-[12px] text-white/50">
                    {ct(lang, 'nutrition.hydration')} : <span className="text-white/80 font-semibold">{(hydml / 1000).toFixed(1)} L</span>
                  </p>
                </div>
              )}

              {isFemale && day.cycle_sync_phase && (
                <div className="bg-[#8b5cf6]/[0.06] border-[0.3px] border-[#8b5cf6]/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b5cf6]/60 mb-0.5">
                    {ct(lang, 'nutrition.cycleSync')}
                  </p>
                  <p className="text-[12px] text-[#a78bfa]/80 font-medium capitalize">{day.cycle_sync_phase}</p>
                </div>
              )}

              {day.recommendations && (
                <div className="border-t-[0.3px] border-white/[0.06] pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-1.5">
                    {ct(lang, 'nutrition.recommendations')}
                  </p>
                  <p className="text-[12px] text-white/55 leading-[1.6] whitespace-pre-line">{day.recommendations}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
