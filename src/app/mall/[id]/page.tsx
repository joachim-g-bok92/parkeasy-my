import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { ParkingGrid } from '@/components/parking-grid'
import { ChevronRight, MapPin } from 'lucide-react'
import type { Mall, Zone, ParkingSlot } from '@/types'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

/* ---------- mock data for demo / no-Supabase mode ---------- */
function buildMockData(id: string): { mall: Mall; zones: Zone[]; slots: ParkingSlot[] } {
  const MALLS: Record<string, Mall> = {
    'mock-1': { id: 'mock-1', name: 'ParkEasy @ Mid Valley', address: 'Mid Valley City, Lingkaran Syed Putra', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', total_floors: 5, logo_url: null, created_at: '' },
    'mock-2': { id: 'mock-2', name: 'ParkEasy @ Pavilion KL', address: '168, Jalan Bukit Bintang', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', total_floors: 4, logo_url: null, created_at: '' },
    'mock-3': { id: 'mock-3', name: 'ParkEasy @ Sunway Pyramid', address: '3, Jalan PJS 11/15, Bandar Sunway', city: 'Petaling Jaya', state: 'Selangor', total_floors: 6, logo_url: null, created_at: '' },
  }
  const mall = MALLS[id] ?? MALLS['mock-1']
  const zones: Zone[] = [
    { id: `${id}-z1`, mall_id: id, name: 'Zone A', level: 'P1', color_code: '#3B82F6', total_slots: 50, created_at: '' },
    { id: `${id}-z2`, mall_id: id, name: 'Zone B', level: 'P1', color_code: '#8B5CF6', total_slots: 40, created_at: '' },
    { id: `${id}-z3`, mall_id: id, name: 'Zone C', level: 'P2', color_code: '#EC4899', total_slots: 60, created_at: '' },
    { id: `${id}-z4`, mall_id: id, name: 'Zone EV', level: 'P2', color_code: '#10B981', total_slots: 20, created_at: '' },
  ]
  const statuses: Array<'available' | 'occupied' | 'maintenance' | 'reserved'> = ['available', 'occupied', 'available', 'occupied', 'available', 'available', 'occupied', 'maintenance', 'available', 'reserved']
  const types: Array<'regular' | 'ev' | 'disabled' | 'family'> = ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'disabled', 'ev']
  const slots: ParkingSlot[] = []
  zones.forEach((zone) => {
    for (let i = 1; i <= zone.total_slots; i++) {
      slots.push({
        id: `${zone.id}-s${i}`,
        zone_id: zone.id,
        slot_number: `${zone.name.split(' ')[1]}-${String(i).padStart(3, '0')}`,
        status: statuses[i % statuses.length],
        type: zone.name.includes('EV') ? 'ev' : types[i % types.length],
        created_at: '',
      })
    }
  })
  return { mall, zones, slots }
}

export default async function MallPage({ params }: Props) {
  const { id } = await params

  let mall: Mall | null = null
  let zones: Zone[] = []
  let slots: ParkingSlot[] = []

  /* try live Supabase first */
  try {
    const supabase = await createClient()
    const { data: mallData } = await supabase.from('malls').select('*').eq('id', id).single()
    if (mallData) {
      mall = mallData as Mall
      const { data: zonesData } = await supabase.from('zones').select('*').eq('mall_id', id).order('name')
      zones = (zonesData ?? []) as Zone[]
      const zoneIds = zones.map((z) => z.id)
      if (zoneIds.length) {
        const { data: slotsData } = await supabase.from('parking_slots').select('*').in('zone_id', zoneIds).order('slot_number')
        slots = (slotsData ?? []) as ParkingSlot[]
      }
    }
  } catch { /* fall through to mock */ }

  /* fall back to mock data (demo mode) */
  if (!mall) {
    const mock = buildMockData(id)
    mall = mock.mall
    zones = mock.zones
    slots = mock.slots
  }

  const totalSlots = slots.length
  const available = slots.filter((s) => s.status === 'available').length
  const occupied = slots.filter((s) => s.status === 'occupied').length

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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Live Parking Map</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              Demo Mode — connect Supabase for live data
            </span>
          </div>
          <ParkingGrid initialSlots={slots} zones={zones} mallId={id} />
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
