'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { runSync, type SyncStatus, type SyncResult } from '@/lib/sync'

const SYNC_INTERVAL_MS = 60_000   // auto-sync every 60 s
const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-ref.supabase.co'

export interface UseSyncReturn {
  status: SyncStatus
  lastSyncedAt: number | null
  dirtyCount: number
  syncNow: () => Promise<void>
  isConfigured: boolean
}

export function useSync(): UseSyncReturn {
  const [status, setStatus]           = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [lastPulledAt, setLastPulledAt] = useState<number | null>(null)
  const syncingRef = useRef(false)

  // Use granular selectors to avoid re-rendering on every store change
  const dirtyQCount  = useGameStore((s) => Object.values(s.customQuestions).filter((q) => q.synced === false).length)
  const dirtySnCount = useGameStore((s) => Object.values(s.sessions).filter((x)        => x.synced === false).length)
  const dirtyTCount  = useGameStore((s) => Object.values(s.teams).filter((x)           => x.synced === false).length)
  const dirtyRCount  = useGameStore((s) => Object.values(s.rounds).filter((x)          => x.synced === false).length)
  const dirtyACount  = useGameStore((s) => Object.values(s.activities).filter((x)      => x.synced === false).length)
  const dirtyCount   = dirtyQCount + dirtySnCount + dirtyTCount + dirtyRCount + dirtyACount

  // getDirtyPayload reads from getState() at call time — no reactive dependency
  const getDirtyPayload = useCallback(() => {
    const { sessions, teams, rounds, activities, customQuestions } = useGameStore.getState()
    return {
      dirtyQuestions:  Object.values(customQuestions).filter((q) => q.synced === false),
      dirtySessions:   Object.values(sessions).filter((s)  => s.synced === false),
      dirtyTeams:      Object.values(teams).filter((t)     => t.synced === false),
      dirtyRounds:     Object.values(rounds).filter((r)    => r.synced === false),
      dirtyActivities: Object.values(activities).filter((a) => a.synced === false),
      lastPulledAt:    lastPulledAt ?? undefined,
    }
  }, [lastPulledAt])

  const syncNow = useCallback(async () => {
    if (!SUPABASE_CONFIGURED || syncingRef.current) return
    syncingRef.current = true
    setStatus('syncing')

    try {
      const payload = getDirtyPayload()
      const result  = await runSync(payload) as any

      if (result.errors.length > 0) {
        console.warn('[sync] errors:', result.errors)
        setStatus('error')
        return
      }

      // Mark pushed records as synced in store
      const { markSynced, mergePulledQuestions } = useGameStore.getState()

      const syncedIds = {
        questions:  payload.dirtyQuestions.map((q) => q.id),
        sessions:   payload.dirtySessions.map((s)  => s.id),
        teams:      payload.dirtyTeams.map((t)     => t.id),
        rounds:     payload.dirtyRounds.map((r)    => r.id),
        activities: payload.dirtyActivities.map((a) => a.id),
      }
      markSynced(syncedIds)

      // Merge pulled remote questions
      if (result._pulled?.length) {
        mergePulledQuestions(result._pulled)
      }

      const now = Date.now()
      setLastSyncedAt(now)
      setLastPulledAt(now)
      setStatus('ok')
    } catch (err) {
      console.error('[sync] unexpected error:', err)
      setStatus('error')
    } finally {
      syncingRef.current = false
    }
  }, [getDirtyPayload])

  // Auto-sync on mount + interval
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return
    syncNow()
    const timer = setInterval(syncNow, SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [syncNow])

  return { status, lastSyncedAt, dirtyCount, syncNow, isConfigured: SUPABASE_CONFIGURED }
}
