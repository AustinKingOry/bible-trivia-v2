'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'correct' | 'wrong' | 'steal' | 'pass' | 'info' | 'error'

interface ToastMsg { id: number; message: string; type: ToastType }

let counter = 0
const listeners: Array<(msg: ToastMsg) => void> = []

export function showToast(message: string, type: ToastType = 'info') {
  const msg: ToastMsg = { id: ++counter, message, type }
  listeners.forEach((l) => l(msg))
}

const STYLES: Record<ToastType, string> = {
  correct: 'bg-card border-success-solid text-success',
  wrong:   'bg-card border-danger-solid text-danger',
  steal:   'bg-card border-info text-info',
  pass:    'bg-card border-secondary text-secondary',
  info:    'bg-card border-primary/50 text-primary',
  error:   'bg-card border-danger-solid text-danger',
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  useEffect(() => {
    const handler = (msg: ToastMsg) => {
      setToasts((prev) => [...prev, msg])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== msg.id)), 2600)
    }
    listeners.push(handler)
    return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1) }
  }, [])

  return (
    <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4rem)] z-[200] flex flex-col items-center gap-2 pointer-events-none md:inset-x-auto md:right-6 md:top-6 md:items-end">
      {toasts.map((t) => (
        <div key={t.id}
          className={`px-4 py-3 rounded-lg border font-semibold text-sm animate-toast-in ${STYLES[t.type]}`}
          style={{ backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px color-mix(in oklab, black 25%, transparent)' }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
