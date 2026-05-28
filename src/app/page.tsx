import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Car, TrendingUp, Zap, ChevronRight } from 'lucide-react'

async function getMallsWithStats() {
  try {
    const supabase = await createClient()
    const { data: malls } = await supabase.from('malls').select('*').order('name')
    if (!malls?.length) return MOCK_MALLS

    const results = await Promise.all(
      malls.map(async (mall) => {
        const { data: zones } = await supabase
          .from('zones')
          .select('id, name, level, color_code, total_slots')
          .eq('mall_id', mall.id)

        if (!zones) return { ...mall, zones: [], total_slots: 0, available_slots: 0 }

        const zoneIds = zones.map((z) => z.id)
        const { data: slots } = await supabase
          .from('parking_slots')
          .select('zone_id, status')
          .in('zone_id', zoneIds)

        const zonesWithStats = zones.map((zone) => {
          const zSlots = slots?.filter((s) => s.zone_id === zone.id) ?? []
          return {
            ...zone,
            available: zSlots.filter((s) => s.status === 'available').length,
            occupied: zSlots.filter((s) => s.status === 'occupied').length,
          }
        })

        const total = slots?.length ?? 0
        const available = slots?.filter((s) => s.status === 'available').length ?? 0

        return { ...mall, zones: zonesWithStats, total_slots: total, available_slots: available }
      })
    )
    return results
  } catch {
    return MOCK_MALLS
  }
}

export default async function HomePage() {
  const malls = await getMallsWithStats()
  const totalSlots = malls.reduce((a, m) => a + (m.total_slots || 0), 0)
  const totalAvail = malls.reduce((a, m) => a + (m.available_slots || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live parking availability across Malaysia
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find Parking.<br />Park Smart.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-blue-100">
            Real-time slot availability, QR digital tickets, and cashless payment — for every major mall in Malaysia.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-slate-200">
          <StatStrip icon={<Car className="h-5 w-5 text-blue-600" />} label="Total Bays" value={`${totalSlots.toLocaleString()}+`} />
          <StatStrip icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="Available Now" value={totalAvail.toLocaleString()} />
          <StatStrip icon={<Zap className="h-5 w-5 text-amber-500" />} label="Malls Connected" value={`${malls.length}`} />
        </div>
      </section>

      {/* Mall list */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Select a Mall</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {malls.map((mall) => {
            const pct = mall.total_slots > 0
              ? Math.round(((mall.available_slots ?? 0) / mall.total_slots) * 100)
              : 0
            const statusVariant = pct > 30 ? 'available' : pct > 10 ? 'reserved' : 'occupied'
            const statusLabel = pct > 30 ? 'Good' : pct > 10 ? 'Limited' : 'Almost Full'

            return (
              <Link key={mall.id} href={`/mall/${mall.id}`}>
                <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                          {mall.name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {mall.city}, {mall.state}
                        </p>
                      </div>
                      <Badge variant={statusVariant as 'available' | 'reserved' | 'occupied'}>{statusLabel}</Badge>
                    </div>

                    {/* Occupancy bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{mall.available_slots ?? 0} available</span>
                        <span>{mall.total_slots} total</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 30 ? 'bg-emerald-500' : pct > 10 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{(mall.zones as unknown[])?.length ?? 0} zones · {mall.total_floors} floors</span>
                      <span className="flex items-center gap-1 font-medium text-blue-600">
                        View map <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        © 2025 ParkEasy MY — Smart Parking for Malaysian Malls · POC v1.0
      </footer>
    </div>
  )
}

function StatStrip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-5">
      {icon}
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

const MOCK_MALLS = [
  { id: 'mock-1', name: 'ParkEasy @ Mid Valley', address: 'Mid Valley City', city: 'Kuala Lumpur', state: 'WP', total_floors: 5, logo_url: null, created_at: '', zones: [], total_slots: 220, available_slots: 87 },
  { id: 'mock-2', name: 'ParkEasy @ Pavilion KL', address: '168, Jalan Bukit Bintang', city: 'Kuala Lumpur', state: 'WP', total_floors: 4, logo_url: null, created_at: '', zones: [], total_slots: 210, available_slots: 34 },
  { id: 'mock-3', name: 'ParkEasy @ Sunway Pyramid', address: 'Bandar Sunway', city: 'Petaling Jaya', state: 'Selangor', total_floors: 6, logo_url: null, created_at: '', zones: [], total_slots: 210, available_slots: 12 },
]
