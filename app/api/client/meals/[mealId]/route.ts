import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// DELETE /api/client/meals/[mealId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { mealId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Ownership check: meal must belong to this client
  const { data: meal } = await service()
    .from('meal_logs')
    .select('id')
    .eq('id', params.mealId)
    .eq('client_id', client.id)
    .single()
  if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await service()
    .from('meal_logs')
    .delete()
    .eq('id', params.mealId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
