import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { plateNumber, zoneId, slotType } = await req.json()

    if (!plateNumber || !zoneId) {
      return NextResponse.json({ error: 'plateNumber and zoneId are required' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Find first available slot in zone matching type preference
    const { data: slots } = await supabase
      .from('parking_slots')
      .select('id, slot_number, type')
      .eq('zone_id', zoneId)
      .eq('status', 'available')
      .eq('type', slotType ?? 'regular')
      .order('slot_number')
      .limit(1)

    // Fallback to any available slot in zone
    const { data: anySlot } = slots?.length
      ? { data: slots }
      : await supabase
          .from('parking_slots')
          .select('id, slot_number, type')
          .eq('zone_id', zoneId)
          .eq('status', 'available')
          .order('slot_number')
          .limit(1)

    if (!anySlot?.length) {
      return NextResponse.json({ error: 'No available slots in this zone' }, { status: 409 })
    }

    const slot = anySlot[0]

    // Atomic: mark slot occupied + create session
    const [slotUpdate, sessionInsert] = await Promise.all([
      supabase
        .from('parking_slots')
        .update({ status: 'occupied' })
        .eq('id', slot.id)
        .eq('status', 'available'),
      supabase
        .from('parking_sessions')
        .insert({ slot_id: slot.id, plate_number: plateNumber, status: 'active' })
        .select('id')
        .single(),
    ])

    if (slotUpdate.error || sessionInsert.error) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: sessionInsert.data.id,
      slotNumber: slot.slot_number,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('parking_sessions')
    .select('*, parking_slots(slot_number, zones(name, level, malls(name)))')
    .eq('status', 'active')
    .order('entry_time', { ascending: false })

  return NextResponse.json(data ?? [])
}
