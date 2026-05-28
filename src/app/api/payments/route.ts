import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, method, fee, durationMinutes } = await req.json()

    if (!sessionId || !method || fee === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify session exists and is unpaid/active
    const { data: session } = await supabase
      .from('parking_sessions')
      .select('id, status, slot_id')
      .eq('id', sessionId)
      .in('status', ['active', 'unpaid'])
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found or already paid' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // If session is still active (cash pay at gate), close it first
    if (session.status === 'active') {
      await supabase
        .from('parking_sessions')
        .update({ exit_time: now, duration_minutes: durationMinutes, fee_myr: fee, status: 'completed' })
        .eq('id', sessionId)
      await supabase
        .from('parking_slots')
        .update({ status: 'available' })
        .eq('id', session.slot_id)
    } else {
      await supabase
        .from('parking_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        amount_myr: fee,
        method,
        status: 'paid',
        paid_at: now,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })

    return NextResponse.json({ paymentId: payment.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
