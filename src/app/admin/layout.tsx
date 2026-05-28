import Link from 'next/link'
import { ParkingCircle, LayoutDashboard, LogIn, LogOut, Settings, Car } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/entry', label: 'Vehicle Entry', icon: LogIn },
  { href: '/admin/exit', label: 'Vehicle Exit', icon: LogOut },
  { href: '/admin/rates', label: 'Rates', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-slate-900 flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <ParkingCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ParkEasy MY</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:text-white">
            <Car className="h-4 w-4" /> Public View
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
