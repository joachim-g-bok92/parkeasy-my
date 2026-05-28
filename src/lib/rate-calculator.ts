import type { Rate, SlotType } from '@/types'

export function calculateFee(
  entryTime: string,
  exitTime: string,
  rate: Rate,
  slotType: SlotType = 'regular'
): { durationMinutes: number; fee: number } {
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  const durationMinutes = Math.ceil((exit.getTime() - entry.getTime()) / 60000)

  if (durationMinutes <= 0) return { durationMinutes: 0, fee: 0 }

  const hours = Math.ceil(durationMinutes / 60)
  let fee = 0

  if (hours <= 1) {
    fee = rate.first_hour_myr
  } else {
    fee = rate.first_hour_myr + (hours - 1) * rate.per_hour_myr
  }

  if (slotType === 'ev') {
    fee += rate.ev_surcharge_myr
  }

  fee = Math.min(fee, rate.daily_max_myr)

  return { durationMinutes, fee: Math.round(fee * 100) / 100 }
}

export const DEFAULT_RATE: Rate = {
  id: 'default',
  mall_id: '',
  first_hour_myr: 2.0,
  per_hour_myr: 1.0,
  daily_max_myr: 20.0,
  ev_surcharge_myr: 2.0,
  created_at: new Date().toISOString(),
}
