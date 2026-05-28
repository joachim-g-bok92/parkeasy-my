import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('parking_sessions')
    .select('*, parking_slots(slot_number, zones(name, level, malls(name, city)))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const supabase = await createAdminClient()

  if (body.action === 'exit') {
    const { durationMinutes, fee } = body
    const now = new Date().toISOString()

    // Get session to find slot_id
    const { data: session } = await supabase
      .from('parking_sessions')
      .select('slot_id')
      .eq('id', id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Update session and free the slot
    const [sessionUpdate, slotUpdate] = await Promise.all([
      supabase
        .from('parking_sessions')
        .update({ exit_time: now, duration_minutes: durationMinutes, fee_myr: fee, status: 'unpaid' })
        .eq('id', id),
      supabase
        .from('parking_slots')
        .update({ status: 'available' })
        .eq('id', session.slot_id),
    ])

    if (sessionUpdate.error || slotUpdate.error) {
      return NextResponse.json({ error: 'Failed to process exit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
