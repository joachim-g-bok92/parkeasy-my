import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { ParkingGrid } from '@/components/parking-grid'
import { ChevronRight, MapPin } from 'lucide-react'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

export default async function MallPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('*')
    .eq('id', id)
    .single()

  if (!mall) notFound()

  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .eq('mall_id', id)
    .order('name')

  const zoneIds = (zones ?? []).map((z) => z.id)

  const { data: slots } = await supabase
    .from('parking_slots')
    .select('*')
    .in('zone_id', zoneIds)
    .order('slot_number')

  const totalSlots = slots?.length ?? 0
  const available = slots?.filter((s) => s.status === 'available').length ?? 0
  const occupied = slots?.filter((s) => s.status === 'occupied').length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600">Malls</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900">{mall.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{mall.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {mall.address}, {mall.city}, {mall.state}
            </p>
          </div>
          <div className="flex gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
            <QuickStat label="Available" value={available} color="text-emerald-600" />
            <QuickStat label="Occupied" value={occupied} color="text-red-500" />
            <QuickStat label="Total" value={totalSlots} color="text-slate-700" />
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-slate-900">
            Live Parking Map
          </h2>
          {zones && zones.length > 0 ? (
            <ParkingGrid
              initialSlots={slots ?? []}
              zones={zones}
              mallId={id}
            />
          ) : (
            <p className="py-12 text-center text-slate-500">
              No zones configured for this mall yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
