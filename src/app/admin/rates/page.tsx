'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Rate } from '@/types'
import { Loader2, Save } from 'lucide-react'

interface MallRate { mall: { id: string; name: string }; rate: Rate | null }

export default function RatesPage() {
  const [mallRates, setMallRates] = useState<MallRate[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: malls } = await supabase.from('malls').select('id, name')
      if (!malls) return
      const { data: rates } = await supabase.from('rates').select('*')
      setMallRates(
        malls.map((m) => ({
          mall: m,
          rate: (rates?.find((r) => r.mall_id === m.id) ?? null) as Rate | null,
        }))
      )
    }
    load()
  }, [])

  function updateRate(mallId: string, field: keyof Rate, value: string) {
    setMallRates((prev) =>
      prev.map((mr) =>
        mr.mall.id === mallId && mr.rate
          ? { ...mr, rate: { ...mr.rate, [field]: parseFloat(value) || 0 } }
          : mr
      )
    )
  }

  async function save(mallId: string, rate: Rate) {
    setSaving(mallId)
    const { error } = await supabase
      .from('rates')
      .upsert({ ...rate, mall_id: mallId })
    setSaving(null)
    if (!error) { setSaved(mallId); setTimeout(() => setSaved(null), 2000) }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Parking Rates</h1>
        <p className="text-sm text-slate-500 mt-1">Configure hourly rates for each mall</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {mallRates.map(({ mall, rate }) =>
          rate ? (
            <Card key={mall.id}>
              <CardHeader><CardTitle>{mall.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RateField
                  label="First Hour (RM)"
                  value={rate.first_hour_myr}
                  onChange={(v) => updateRate(mall.id, 'first_hour_myr', v)}
                />
                <RateField
                  label="Subsequent Hours (RM/hr)"
                  value={rate.per_hour_myr}
                  onChange={(v) => updateRate(mall.id, 'per_hour_myr', v)}
                />
                <RateField
                  label="Daily Maximum (RM)"
                  value={rate.daily_max_myr}
                  onChange={(v) => updateRate(mall.id, 'daily_max_myr', v)}
                />
                <RateField
                  label="EV Charging Surcharge (RM)"
                  value={rate.ev_surcharge_myr}
                  onChange={(v) => updateRate(mall.id, 'ev_surcharge_myr', v)}
                />
                <Button
                  onClick={() => save(mall.id, rate)}
                  disabled={saving === mall.id}
                  variant={saved === mall.id ? 'success' : 'default'}
                  className="w-full"
                >
                  {saving === mall.id
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    : saved === mall.id
                    ? '✓ Saved!'
                    : <><Save className="h-4 w-4" /> Save Rates</>
                  }
                </Button>
              </CardContent>
            </Card>
          ) : null
        )}
      </div>
    </div>
  )
}

function RateField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-sm text-slate-500">RM</span>
        <Input
          type="number"
          step="0.50"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
