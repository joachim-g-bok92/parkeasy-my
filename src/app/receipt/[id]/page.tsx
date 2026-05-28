import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatDuration, formatMYR } from '@/lib/utils'
import { CheckCircle, ParkingCircle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      parking_sessions (
        plate_number, entry_time, exit_time, duration_minutes, fee_myr,
        parking_slots (
          slot_number,
          zones ( name, level, malls ( name, city, address ) )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!payment) notFound()

  const session = payment.parking_sessions as Record<string, unknown>
  const slot = session?.parking_slots as Record<string, unknown>
  const zone = slot?.zones as Record<string, unknown>
  const mall = zone?.malls as Record<string, unknown>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12">
        {/* Receipt card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-6 text-white text-center">
            <CheckCircle className="mx-auto mb-2 h-12 w-12" />
            <h1 className="text-xl font-bold">Payment Successful</h1>
            <p className="mt-1 text-emerald-100 text-sm">Thank you for using ParkEasy MY</p>
          </div>

          <div className="px-6 py-5 space-y-3">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-slate-900">{formatMYR(payment.amount_myr)}</p>
              <p className="text-sm text-slate-500 mt-1">
                {payment.method?.toUpperCase()} · <Badge variant="paid">Paid</Badge>
              </p>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5">
              <Row label="Mall" value={String(mall?.name ?? '-')} />
              <Row label="Address" value={String(mall?.address ?? '-')} />
              <Row label="Zone / Slot" value={`${String(zone?.name ?? '-')} ${String(zone?.level ?? '')} · ${String(slot?.slot_number ?? '-')}`} />
              <Row label="Vehicle" value={String(session?.plate_number ?? '-')} />
              <Row label="Entry" value={session?.entry_time ? formatDateTime(String(session.entry_time)) : '-'} />
              <Row label="Exit" value={session?.exit_time ? formatDateTime(String(session.exit_time)) : '-'} />
              <Row label="Duration" value={session?.duration_minutes ? formatDuration(Number(session.duration_minutes)) : '-'} />
            </div>

            <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
              <p>Receipt #{id.slice(0, 12).toUpperCase()}</p>
              <p>Issued {formatDateTime(payment.paid_at ?? payment.created_at)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-center gap-2 bg-slate-50">
            <ParkingCircle className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-500 font-medium">ParkEasy MY — Smart Parking</span>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Malls
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}
