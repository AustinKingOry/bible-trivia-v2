'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Download, RefreshCw, Share, SquarePlus, X } from 'lucide-react'
import { usePwa } from '@/hooks/usePwa'

const DISMISS_KEY = 'tp-install-dismissed'
const DISMISS_DAYS = 14
const IMMERSIVE = /\/session\/[^/]+\/game\/|\/play\//

const card = 'pointer-events-auto flex items-start gap-3 rounded-2xl border bg-card p-3.5 shadow-xl shadow-black/20 animate-slide-up'
const btn = 'rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors'

export function PwaProvider() {
  const pathname = usePathname()
  const { canInstall, isInstalled, isIos, install } = usePwa()
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [showInstall, setShowInstall] = useState(false)

  // Register the service worker (production only: it would fight HMR in dev).
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    let reg: ServiceWorkerRegistration | undefined
    let reloading = false
    const onChange = () => { if (!reloading) { reloading = true; window.location.reload() } }
    const track = (r: ServiceWorkerRegistration) => {
      if (r.waiting && navigator.serviceWorker.controller) setWaiting(r.waiting)
      r.addEventListener('updatefound', () => {
        const w = r.installing
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) setWaiting(w)
        })
      })
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((r) => { reg = r; track(r) }).catch(() => {})
    navigator.serviceWorker.addEventListener('controllerchange', onChange)
    const check = () => { if (document.visibilityState === 'visible') reg?.update().catch(() => {}) }
    document.addEventListener('visibilitychange', check)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  // Offer installation after a short delay, and not again for two weeks once dismissed.
  const eligible = !isInstalled && (canInstall || isIos)
  useEffect(() => {
    if (!eligible) { setShowInstall(false); return }
    const last = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (Date.now() - last < DISMISS_DAYS * 864e5) return
    const t = setTimeout(() => setShowInstall(true), 8000)
    return () => clearTimeout(t)
  }, [eligible])

  const dismiss = useCallback(() => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setShowInstall(false) }, [])
  const immersive = IMMERSIVE.test(pathname)

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-[150] flex flex-col gap-2 md:inset-x-auto md:bottom-5 md:right-5 md:w-96">
      {waiting && !immersive && (
        <div role="status" className={card}>
          <RefreshCw size={20} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Update ready</p>
            <p className="text-xs text-muted-foreground">Reload to get the latest version. Your sessions are safe.</p>
            <div className="mt-2.5 flex gap-2">
              <button onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })} className={`${btn} bg-primary text-background`}>Reload</button>
              <button onClick={() => setWaiting(null)} className={`${btn} text-muted-foreground hover:bg-surface`}>Later</button>
            </div>
          </div>
        </div>
      )}
      {showInstall && !immersive && (
        <div role="dialog" aria-label="Install TriviaPath" className={card}>
          <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install TriviaPath</p>
            {isIos && !canInstall ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Tap <Share size={13} className="mx-0.5 inline -translate-y-px text-primary" /> then <b>Add to Home Screen</b>
                <SquarePlus size={13} className="ml-1 inline -translate-y-px text-primary" /> for full-screen, offline play.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Runs full-screen and works offline, ideal for live sessions.</p>
                <div className="mt-2.5 flex gap-2">
                  <button onClick={async () => { await install(); setShowInstall(false) }} className={`${btn} inline-flex items-center gap-1.5 bg-primary text-background`}>
                    <Download size={15} /> Install
                  </button>
                  <button onClick={dismiss} className={`${btn} text-muted-foreground hover:bg-surface`}>Not now</button>
                </div>
              </>
            )}
          </div>
          <button onClick={dismiss} aria-label="Dismiss" className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-surface"><X size={16} /></button>
        </div>
      )}
    </div>
  )
}
