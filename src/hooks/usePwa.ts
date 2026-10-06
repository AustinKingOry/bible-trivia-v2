'use client'

import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaState { canInstall: boolean; isInstalled: boolean; isIos: boolean }

let deferred: BeforeInstallPromptEvent | null = null
let state: PwaState = { canInstall: false, isInstalled: false, isIos: false }
const SERVER: PwaState = state
const listeners = new Set<() => void>()
let started = false

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  state = { canInstall: false, isInstalled: standalone, isIos: ios }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    set({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => { deferred = null; set({ canInstall: false, isInstalled: true }) })
}

function subscribe(cb: () => void) {
  start()
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function usePwa() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER)
  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    set({ canInstall: false })
    return outcome
  }
  return { ...s, install }
}
