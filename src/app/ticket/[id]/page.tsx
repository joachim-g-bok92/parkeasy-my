import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMYR } from '@/lib/utils'
import { TicketQR } from './ticket-qr'
import { Car, Clock, MapPin, ParkingCircle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TicketPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('parking_sessions')
    .select(`
      *,
      parking_slots (
        slot_number, type, status,
        zones ( name, level, malls ( name, city ) )
      )
    `)
    .eq('id', id)
    .single()

  if (!session) notFound()

  const slot = session.parking_slots as Record<string, unknown>
  const zone = slot?.zones as Record<string, unknown>
  const mall = zone?.malls as Record<string, unknown>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12">
        {/* Ticket card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white">
            <div className="flex items-center gap-2.5">
              <ParkingCircle className="h-6 w-6" />
              <span className="text-lg font-bold">ParkEasy MY</span>
            </div>
            <p className="mt-1 text-sm text-blue-100">Digital Parking Ticket</p>
          </div>

          {/* Dashed divider */}
          <div className="relative flex items-center px-6 py-0">
            <div className="absolute left-0 h-6 w-3 rounded-r-full bg-slate-100 border-r border-y border-slate-200" />
            <div className="w-full border-t-2 border-dashed border-slate-200" />
            <div className="absolute right-0 h-6 w-3 rounded-l-full bg-slate-100 border-l border-y border-slate-200" />
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Detail icon={<Car className="h-4 w-4 text-slate-400" />} label="Plate" value={session.plate_number} />
              <Detail icon={<MapPin className="h-4 w-4 text-slate-400" />} label="Slot" value={String(slot?.slot_number ?? '-')} />
              <Detail icon={<MapPin className="h-4 w-4 text-slate-400" />} label="Zone / Level" value={`${String(zone?.name ?? '-')} · ${String(zone?.level ?? '-')}`} />
              <Detail icon={<Clock className="h-4 w-4 text-slate-400" />} label="Entry Time" value={formatDateTime(session.entry_time)} />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium">{String(mall?.name ?? 'Mall')}</span> · {String(mall?.city ?? '')}
            </div>

            {session.fee_myr && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <span className="text-sm font-medium text-emerald-700">Total Fee</span>
                <span className="text-lg font-bold text-emerald-700">{formatMYR(session.fee_myr)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge variant={session.status === 'active' ? 'available' : session.status === 'completed' ? 'paid' : 'pending'}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              <span className="text-xs text-slate-400">#{session.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="border-t border-dashed border-slate-200 px-6 py-5 flex flex-col items-center gap-2">
            <TicketQR sessionId={id} />
            <p className="text-xs text-slate-400 text-center">
              Scan at exit gate · Valid for this session only
            </p>
          </div>
        </div>

        {session.status === 'active' && (
          <a
            href={`/pay/${id}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Pay & Exit
          </a>
        )}
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
        {icon} {label}
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
