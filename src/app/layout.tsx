import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ParkEasy MY — Smart Parking for Malaysian Malls',
  description: 'Real-time parking availability, digital tickets, and cashless payment for shopping malls in Malaysia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
