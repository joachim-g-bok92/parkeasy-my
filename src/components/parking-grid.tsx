'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ParkingSlot, Zone } from '@/types'
import { Zap, Users, Accessibility, Car } from 'lucide-react'

interface Props {
  initialSlots: ParkingSlot[]
  zones: Zone[]
  mallId: string
}

const SLOT_ICONS = {
  ev: <Zap className="h-3 w-3" />,
  family: <Users className="h-3 w-3" />,
  disabled: <Accessibility className="h-3 w-3" />,
  regular: null,
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer',
  occupied: 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed',
  reserved: 'bg-amber-100 border-amber-300 text-amber-700',
  maintenance: 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed',
}

export function ParkingGrid({ initialSlots, zones, mallId }: Props) {
  const [slots, setSlots] = useState<ParkingSlot[]>(initialSlots)
  const [activeZone, setActiveZone] = useState<string>(zones[0]?.id ?? '')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`parking-slots-${mallId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parking_slots' },
        (payload) => {
          setSlots((prev) =>
            prev.map((s) => (s.id === payload.new.id ? { ...s, ...(payload.new as ParkingSlot) } : s))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, mallId])

  const zoneSlots = slots.filter((s) => s.zone_id === activeZone)
  const available = zoneSlots.filter((s) => s.status === 'available').length
  const occupied = zoneSlots.filter((s) => s.status === 'occupied').length
  const reserved = zoneSlots.filter((s) => s.status === 'reserved').length
  const maintenance = zoneSlots.filter((s) => s.status === 'maintenance').length
  const activeZoneData = zones.find((z) => z.id === activeZone)

  return (
    <div className="space-y-6">
      {/* Zone tabs */}
      <div className="flex flex-wrap gap-2">
        {zones.map((zone) => {
          const zSlots = slots.filter((s) => s.zone_id === zone.id)
          const zAvail = zSlots.filter((s) => s.status === 'available').length
          return (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                activeZone === zone.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              {zone.name}
              <span className="ml-2 text-xs opacity-75">
                {zone.level} · {zAvail}/{zSlots.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Zone stats bar */}
      <div className="grid grid-cols-4 gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <Stat label="Available" value={available} color="text-emerald-600" />
        <Stat label="Occupied" value={occupied} color="text-red-500" />
        <Stat label="Reserved" value={reserved} color="text-amber-500" />
        <Stat label="Maintenance" value={maintenance} color="text-slate-400" />
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live · {activeZoneData?.name} — {activeZoneData?.level} Level
      </div>

      {/* Slot grid */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {zoneSlots.map((slot) => (
          <div
            key={slot.id}
            title={`${slot.slot_number} — ${slot.status}`}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border p-2 transition-colors text-center',
              STATUS_STYLES[slot.status]
            )}
          >
            {SLOT_ICONS[slot.type] && (
              <span className="mb-0.5">{SLOT_ICONS[slot.type]}</span>
            )}
            <span className="text-xs font-medium leading-none">
              {slot.slot_number.split('-')[1]}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <LegendItem color="bg-emerald-200 border-emerald-300" label="Available" />
        <LegendItem color="bg-red-200 border-red-300" label="Occupied" />
        <LegendItem color="bg-amber-200 border-amber-300" label="Reserved" />
        <LegendItem color="bg-slate-200 border-slate-300" label="Maintenance" />
        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-cyan-600" /> EV Charging</span>
        <span className="flex items-center gap-1"><Accessibility className="h-3 w-3 text-purple-600" /> OKU</span>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded border', color)} />
      {label}
    </span>
  )
}
