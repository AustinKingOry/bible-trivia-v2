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
  correct: 'bg-emerald-900/90 border-emerald-500 text-emerald-100',
  wrong:   'bg-red-900/90 border-red-500 text-red-100',
  steal:   'bg-blue-900/90 border-blue-400 text-blue-100',
  pass:    'bg-orange-900/90 border-orange-500 text-orange-100',
  info:    'bg-[#142240]/95 border-[#F5C842]/40 text-[#F5C842]',
  error:   'bg-red-950/90 border-red-700 text-red-300',
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
    <div className="fixed top-14 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`px-4 py-3 rounded-lg border font-semibold text-sm animate-toast-in ${STYLES[t.type]}`}
          style={{ backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
