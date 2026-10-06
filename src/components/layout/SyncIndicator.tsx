'use client'

import { useState } from 'react'
import { useSync } from '@/hooks/useSync'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/layout/AuthModal'

export function SyncIndicator() {
  const { status, lastSyncedAt, dirtyCount, syncNow, isConfigured } = useSync()
  const { user, loading: authLoading, signOut, isConfigured: authConfigured } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  // Supabase not set up at all
  if (!isConfigured || !authConfigured) {
    return (
      <div className="px-3 py-2.5 mx-2 mb-2 rounded-lg hidden lg:block"
        style={{ background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)' }}>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Cloud Sync</div>
        <div className="text-[10px] text-muted-foreground">Not configured</div>
        <div className="text-[9px] text-subtle mt-0.5">Add Supabase keys to .env.local</div>
      </div>
    )
  }

  // Auth loading
  if (authLoading) return (
    <div className="px-2 pb-3 hidden lg:block">
      <div className="px-3 py-2.5 rounded-lg" style={{ background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)' }}>
        <div className="text-[9px] text-muted-foreground animate-pulse">Checking auth…</div>
      </div>
    </div>
  )

  // Not signed in — show login prompt
  if (!user) {
    return (
      <>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="px-2 pb-3 hidden lg:block">
          <div className="px-3 py-3 rounded-lg flex flex-col gap-2"
            style={{ background: 'color-mix(in oklab, var(--primary) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">Not signed in</span>
            </div>
            <p className="text-[9px] text-subtle leading-relaxed">
              Sign in to sync questions, sessions and settings to the cloud.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all"
              style={{ background: 'color-mix(in oklab, var(--primary) 18%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 30%, transparent)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 18%, transparent)')}
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </>
    )
  }

  // Signed in — show sync status
  const statusConfig = {
    idle:    { dot: 'var(--muted-foreground)', label: 'Ready',    pulse: false },
    syncing: { dot: 'var(--primary)', label: 'Syncing…', pulse: true  },
    ok:      { dot: 'var(--success)', label: 'Synced',   pulse: false },
    error:   { dot: 'var(--danger)', label: 'Error',    pulse: false },
  }[status]

  const timeLabel = (() => {
    if (!lastSyncedAt) return 'Never synced'
    const diff = Math.floor((Date.now() - lastSyncedAt) / 1000)
    if (diff < 10)   return 'Just now'
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })()

  const emailShort = user.email
    ? user.email.length > 18 ? user.email.slice(0, 15) + '…' : user.email
    : 'Signed in'

  return (
    <div className="px-2 pb-3 hidden lg:block">
      <div className="px-3 py-2.5 rounded-lg flex flex-col gap-1.5"
        style={{ background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)' }}>

        {/* User row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-success" />
            <span className="text-[9px] text-success font-semibold truncate">{emailShort}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[9px] text-muted-foreground hover:text-red-400 transition-colors shrink-0 ml-1"
            title="Sign out"
          >
            out
          </button>
        </div>

        {/* Sync status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: statusConfig.dot,
                boxShadow: statusConfig.pulse ? `0 0 6px ${statusConfig.dot}` : undefined,
                animation: statusConfig.pulse ? 'pulse 1s ease-in-out infinite' : undefined,
              }}
            />
            <span className="text-[10px] font-semibold" style={{ color: statusConfig.dot }}>
              {statusConfig.label}
            </span>
          </div>
          <button
            onClick={syncNow}
            disabled={status === 'syncing'}
            className="text-[9px] font-semibold transition-colors disabled:opacity-40"
            style={{ color: 'var(--primary)' }}
            title="Sync now"
          >
            {status === 'syncing' ? '…' : '↑↓'}
          </button>
        </div>

        <div className="text-[9px] text-subtle">{timeLabel}</div>

        {/* Pending count */}
        {dirtyCount > 0 && (
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-primary">{dirtyCount} pending</span>
            <button
              onClick={syncNow}
              disabled={status === 'syncing'}
              className="text-[9px] px-1.5 py-0.5 rounded-sm font-semibold disabled:opacity-40"
              style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)', color: 'var(--primary)' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 28%, transparent)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 15%, transparent)')}
            >
              Sync now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-[9px] text-danger">
            Error · <button className="underline" onClick={syncNow}>retry</button>
          </div>
        )}
      </div>
    </div>
  )
}
