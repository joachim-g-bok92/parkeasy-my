'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export function TicketQR({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, sessionId, {
      width: 180,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
  }, [sessionId])

  return <canvas ref={canvasRef} className="rounded-lg" />
}
