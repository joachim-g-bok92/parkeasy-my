export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'
export type SlotType = 'regular' | 'disabled' | 'ev' | 'family'
export type SessionStatus = 'active' | 'completed' | 'unpaid'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'fpx' | 'card' | 'tng' | 'cash' | 'pending'
export type UserRole = 'user' | 'admin' | 'operator'

export interface Mall {
  id: string
  name: string
  address: string
  city: string
  state: string
  total_floors: number
  logo_url: string | null
  created_at: string
}

export interface Zone {
  id: string
  mall_id: string
  name: string
  level: string
  color_code: string
  total_slots: number
  created_at: string
}

export interface ParkingSlot {
  id: string
  zone_id: string
  slot_number: string
  status: SlotStatus
  type: SlotType
  created_at: string
}

export interface ParkingSession {
  id: string
  slot_id: string
  user_id: string | null
  plate_number: string
  entry_time: string
  exit_time: string | null
  duration_minutes: number | null
  fee_myr: number | null
  status: SessionStatus
  created_at: string
  parking_slots?: ParkingSlot & { zones?: Zone }
}

export interface Payment {
  id: string
  session_id: string
  amount_myr: number
  method: PaymentMethod
  billplz_id: string | null
  status: PaymentStatus
  paid_at: string | null
  created_at: string
}

export interface Rate {
  id: string
  mall_id: string
  first_hour_myr: number
  per_hour_myr: number
  daily_max_myr: number
  ev_surcharge_myr: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  vehicle_plates: string[]
  role: UserRole
  created_at: string
}

export interface MallWithStats extends Mall {
  zones: (Zone & {
    available: number
    occupied: number
  })[]
  total_slots: number
  available_slots: number
}
