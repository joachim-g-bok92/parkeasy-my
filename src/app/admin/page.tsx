import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMYR, formatDateTime, formatDuration } from '@/lib/utils'
import { Car, ParkingCircle, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: malls },
    { data: activeSessions },
    { data: todaySessions },
    { data: todayPayments },
    { data: allSlots },
  ] = await Promise.all([
    supabase.from('malls').select('id, name, city'),
    supabase.from('parking_sessions').select('*, parking_slots(slot_number, zones(name, level, malls(name)))').eq('status', 'active').order('entry_time', { ascending: false }),
    supabase.from('parking_sessions').select('id, status').gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    supabase.from('payments').select('amount_myr, status').eq('status', 'paid').gte('paid_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    supabase.from('parking_slots').select('status'),
  ])

  const totalSlots = allSlots?.length ?? 0
  const occupiedSlots = allSlots?.filter((s) => s.status === 'occupied').length ?? 0
  const availableSlots = allSlots?.filter((s) => s.status === 'available').length ?? 0
  const occupancyPct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
  const todayRevenue = todayPayments?.reduce((a, p) => a + (p.amount_myr ?? 0), 0) ?? 0
  const todayTransactions = todaySessions?.length ?? 0

  const stats = [
    { label: 'Active Sessions', value: activeSessions?.length ?? 0, icon: <Car className="h-5 w-5 text-blue-600" />, color: 'text-blue-600' },
    { label: 'Available Slots', value: availableSlots, icon: <ParkingCircle className="h-5 w-5 text-emerald-600" />, color: 'text-emerald-600' },
    { label: "Today's Transactions", value: todayTransactions, icon: <CheckCircle className="h-5 w-5 text-amber-600" />, color: 'text-amber-600' },
    { label: "Today's Revenue", value: formatMYR(todayRevenue), icon: <TrendingUp className="h-5 w-5 text-purple-600" />, color: 'text-purple-600', isText: true },
  ]

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of all parking operations</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/entry" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Vehicle Entry
          </Link>
          <Link href="/admin/exit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Vehicle Exit
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</span>
                {s.icon}
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy bar */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Occupancy</span>
            <span className="text-sm font-bold text-slate-900">{occupancyPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                occupancyPct < 60 ? 'bg-emerald-500' : occupancyPct < 85 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {occupiedSlots} occupied · {availableSlots} available · {totalSlots} total
          </p>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Parking Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!activeSessions?.length ? (
            <p className="p-6 text-center text-sm text-slate-400">No active sessions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="px-4 py-3 text-left">Plate</th>
                    <th className="px-4 py-3 text-left">Slot</th>
                    <th className="px-4 py-3 text-left">Entry Time</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeSessions.map((s) => {
                    const slot = s.parking_slots as Record<string, unknown>
                    const zone = slot?.zones as Record<string, unknown>
                    const mall = zone?.malls as Record<string, unknown>
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.plate_number}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(zone?.name ?? '')} {String(zone?.level ?? '')} · {String(slot?.slot_number ?? '')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(s.entry_time)}</td>
                        <td className="px-4 py-3"><Badge variant="available">Active</Badge></td>
                        <td className="px-4 py-3">
                          <Link href={`/ticket/${s.id}`} className="text-blue-600 hover:underline font-medium">Ticket</Link>
                          {' · '}
                          <Link href={`/pay/${s.id}`} className="text-emerald-600 hover:underline font-medium">Exit</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
