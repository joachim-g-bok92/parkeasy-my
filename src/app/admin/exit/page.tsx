'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, formatDuration, formatMYR } from '@/lib/utils'
import { calculateFee, DEFAULT_RATE } from '@/lib/rate-calculator'
import type { ParkingSession, Rate } from '@/types'
import { Search, Loader2, LogOut } from 'lucide-react'

export default function ExitPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<ParkingSession | null>(null)
  const [rate, setRate] = useState<Rate>(DEFAULT_RATE)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSession(null)

    const supabase = createClient()
    const { data, error: dbErr } = await supabase
      .from('parking_sessions')
      .select(`
        *,
        parking_slots (
          id, slot_number, type, zone_id,
          zones ( id, name, level, mall_id, malls ( name ) )
        )
      `)
      .eq('status', 'active')
      .or(`plate_number.eq.${query.toUpperCase()},id.eq.${query}`)
      .limit(1)
      .single()

    setLoading(false)
    if (dbErr || !data) { setError('No active session found for this plate / ticket ID'); return }

    setSession(data as unknown as ParkingSession)

    const slot = data.parking_slots as Record<string, unknown>
    const zone = slot?.zones as Record<string, unknown>
    const mallId = zone?.mall_id as string
    if (mallId) {
      const { data: rateData } = await supabase.from('rates').select('*').eq('mall_id', mallId).single()
      if (rateData) setRate(rateData as Rate)
    }
  }

  async function processExit() {
    if (!session) return
    setProcessing(true)
    setError('')

    const slot = session.parking_slots as unknown as Record<string, unknown>
    const { durationMinutes, fee } = calculateFee(
      session.entry_time,
      new Date().toISOString(),
      rate,
      (slot?.type as 'regular' | 'ev' | 'disabled' | 'family') ?? 'regular'
    )

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'exit', durationMinutes, fee }),
    })
    const data = await res.json()
    setProcessing(false)

    if (!res.ok) { setError(data.error ?? 'Failed to process exit'); return }
    router.push(`/pay/${session.id}`)
  }

  const now = new Date().toISOString()
  const { durationMinutes, fee } = session
    ? calculateFee(session.entry_time, now, rate, ((session.parking_slots as unknown as Record<string, unknown>)?.type as 'regular' | 'ev') ?? 'regular')
    : { durationMinutes: 0, fee: 0 }

  const slot = session?.parking_slots as unknown as Record<string, unknown>
  const zone = slot?.zones as Record<string, unknown>
  const mall = (zone?.malls as Record<string, unknown>)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Exit</h1>
        <p className="text-sm text-slate-500 mt-1">Look up a session by plate number or ticket ID</p>
      </div>

      <div className="max-w-lg space-y-6">
        <Card>
          <CardContent className="p-5">
            <form onSubmit={search} className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Plate (e.g. WKL 1234) or Session ID"
                  className="uppercase"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        {session && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Session</CardTitle>
                <Badge variant="available">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Plate" value={session.plate_number} bold />
              <Row label="Mall" value={String(mall?.name ?? '-')} />
              <Row label="Slot" value={`${String(zone?.name ?? '')} ${String(zone?.level ?? '')} · ${String(slot?.slot_number ?? '')}`} />
              <Row label="Entry" value={formatDateTime(session.entry_time)} />
              <Row label="Duration" value={formatDuration(durationMinutes)} />

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Calculated Fee</p>
                  <p className="text-2xl font-bold text-blue-800">{formatMYR(fee)}</p>
                </div>
                <div className="text-right text-xs text-blue-600">
                  <p>RM {rate.first_hour_myr.toFixed(2)} first hr</p>
                  <p>RM {rate.per_hour_myr.toFixed(2)}/subsequent hr</p>
                </div>
              </div>

              <Button
                onClick={processExit}
                disabled={processing}
                size="lg"
                className="w-full"
              >
                {processing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  : <><LogOut className="h-4 w-4" /> Confirm Exit & Proceed to Payment</>
                }
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}>{value}</span>
    </div>
  )
}
