'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatMYR } from '@/lib/utils'
import { CreditCard, Smartphone, Banknote, Loader2 } from 'lucide-react'

const METHODS = [
  { id: 'fpx', label: 'FPX Online Banking', icon: <Banknote className="h-5 w-5" /> },
  { id: 'tng', label: "Touch 'n Go eWallet", icon: <Smartphone className="h-5 w-5" /> },
  { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'cash', label: 'Pay at Cashier', icon: <Banknote className="h-5 w-5" /> },
]

export function PaymentForm({
  sessionId,
  fee,
  durationMinutes,
}: {
  sessionId: string
  fee: number
  durationMinutes: number
}) {
  const [method, setMethod] = useState<string>('tng')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, method, fee, durationMinutes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Payment failed')
      router.push(`/receipt/${data.paymentId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Select Payment Method</h2>
      <div className="grid grid-cols-2 gap-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
              method === m.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={method === m.id ? 'text-blue-600' : 'text-slate-400'}>
              {m.icon}
            </span>
            <span className="font-medium leading-tight">{m.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handlePay}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
        ) : (
          `Pay ${formatMYR(fee)}`
        )}
      </Button>
    </div>
  )
}
