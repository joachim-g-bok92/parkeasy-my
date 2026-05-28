import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { PaymentForm } from './payment-form'
import { formatDateTime, formatDuration, formatMYR } from '@/lib/utils'
import { calculateFee, DEFAULT_RATE } from '@/lib/rate-calculator'
import { Clock, Car } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PayPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('parking_sessions')
    .select(`
      *,
      parking_slots (
        slot_number, type,
        zones ( name, level, mall_id,
          malls ( name, city )
        )
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!session) notFound()

  const slot = session.parking_slots as Record<string, unknown>
  const zone = slot?.zones as Record<string, unknown>
  const mall = zone?.malls as Record<string, unknown>
  const mallId = zone?.mall_id as string

  const { data: rate } = await supabase
    .from('rates')
    .select('*')
    .eq('mall_id', mallId)
    .single()

  const now = new Date().toISOString()
  const { durationMinutes, fee } = calculateFee(
    session.entry_time,
    now,
    rate ?? DEFAULT_RATE,
    (slot?.type as string) as 'regular' | 'ev'
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Exit & Payment</h1>

        {/* Summary */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Parking Summary</h2>
          <Row label="Mall" value={String(mall?.name ?? '-')} />
          <Row label="Slot" value={String(slot?.slot_number ?? '-')} />
          <Row label="Zone / Level" value={`${String(zone?.name ?? '-')} · ${String(zone?.level ?? '-')}`} />
          <Row label="Entry Time" value={formatDateTime(session.entry_time)} />
          <Row label="Duration" value={formatDuration(durationMinutes)} />
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total Payable</span>
            <span className="text-2xl font-bold text-blue-700">{formatMYR(fee)}</span>
          </div>
        </div>

        {/* Rate info */}
        <p className="mb-6 text-xs text-slate-500">
          Rate: RM {(rate ?? DEFAULT_RATE).first_hour_myr.toFixed(2)} first hour · RM {(rate ?? DEFAULT_RATE).per_hour_myr.toFixed(2)}/subsequent hr · Max RM {(rate ?? DEFAULT_RATE).daily_max_myr.toFixed(2)}/day
        </p>

        <PaymentForm sessionId={id} fee={fee} durationMinutes={durationMinutes} />

        <Link href={`/ticket/${id}`} className="mt-4 block text-center text-sm text-slate-500 hover:text-blue-600">
          ← Back to ticket
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}
