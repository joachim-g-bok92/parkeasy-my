import Link from 'next/link'
import { ParkingCircle } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <ParkingCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">ParkEasy</span>
          <span className="text-lg font-bold text-blue-600">MY</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Sign In
          </Link>
          <Link
            href="/admin"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </nav>
  )
}
