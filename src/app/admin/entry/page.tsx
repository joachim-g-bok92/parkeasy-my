'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Zone } from '@/types'
import { Car, Loader2, CheckCircle } from 'lucide-react'

export default function EntryPage() {
  const [plate, setPlate] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [slotType, setSlotType] = useState<'regular' | 'ev' | 'disabled' | 'family'>('regular')
  const [zones, setZones] = useState<Zone[]>([])
  const [malls, setMalls] = useState<{ id: string; name: string }[]>([])
  const [selectedMall, setSelectedMall] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sessionId: string; slotNumber: string } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('malls').select('id, name').then(({ data }) => {
      if (data) { setMalls(data); setSelectedMall(data[0]?.id ?? '') }
    })
  }, [])

  useEffect(() => {
    if (!selectedMall) return
    supabase.from('zones').select('*').eq('mall_id', selectedMall).then(({ data }) => {
      if (data) { setZones(data); setSelectedZoneId(data[0]?.id ?? '') }
    })
  }, [selectedMall])

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!plate.trim() || !selectedZoneId) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plateNumber: plate.toUpperCase().trim(), zoneId: selectedZoneId, slotType }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Failed to create session'); return }
    setResult({ sessionId: data.sessionId, slotNumber: data.slotNumber })
    setPlate('')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Entry</h1>
        <p className="text-sm text-slate-500 mt-1">Register an incoming vehicle and assign a parking slot</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Entry Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleEntry} className="space-y-4">
              <div>
                <Label htmlFor="mall">Mall</Label>
                <select
                  id="mall"
                  value={selectedMall}
                  onChange={(e) => setSelectedMall(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {malls.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="plate">Vehicle Plate Number</Label>
                <Input
                  id="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. WKL 1234"
                  className="mt-1.5 uppercase"
                  required
                />
              </div>

              <div>
                <Label>Zone</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setSelectedZoneId(z.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedZoneId === z.id
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {z.name} <span className="opacity-70 text-xs">{z.level}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Slot Type</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(['regular', 'ev', 'disabled', 'family'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlotType(t)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                        slotType === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'ev' ? 'EV Charging' : t === 'disabled' ? 'OKU' : t}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Assigning slot...</> : <><Car className="h-4 w-4" /> Register Entry</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <div>
                <p className="text-lg font-bold text-emerald-800">Slot Assigned!</p>
                <p className="text-sm text-emerald-600">Vehicle successfully registered</p>
              </div>
              <div className="rounded-xl bg-white border border-emerald-200 p-4 space-y-2">
                <p className="text-sm text-slate-500">Assigned Slot</p>
                <p className="text-3xl font-extrabold text-slate-900">{result.slotNumber}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push(`/ticket/${result.sessionId}`)}>
                  View Digital Ticket
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Register Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!result && (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="p-6 text-center text-slate-400 flex flex-col items-center justify-center h-full gap-3">
              <Car className="h-10 w-10" />
              <p className="text-sm">Fill in the entry form to assign a parking slot. A digital ticket with QR code will be generated automatically.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
