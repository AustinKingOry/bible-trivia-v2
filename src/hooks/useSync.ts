'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuth } from '@/hooks/useAuth'
import { runSync, type SyncStatus } from '@/lib/sync'
import { getSupabaseClient } from '@/lib/supabase'

const SYNC_INTERVAL_MS = 60_000

function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') return false
  return getSupabaseClient() !== null
}

export interface UseSyncReturn {
  status: SyncStatus
  lastSyncedAt: number | null
  dirtyCount: number
  syncNow: () => Promise<void>
  isConfigured: boolean
}

export function useSync(): UseSyncReturn {
  const [status, setStatus]             = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [lastPulledAt, setLastPulledAt] = useState<number | null>(null)
  const syncingRef = useRef(false)

  const { user } = useAuth()

  // Granular dirty-count selectors — no full store re-renders
  const dirtyQCount  = useGameStore((s) => Object.values(s.customQuestions).filter((q) => q.synced === false).length)
  const dirtySnCount = useGameStore((s) => Object.values(s.sessions).filter((x)        => x.synced === false).length)
  const dirtyTCount  = useGameStore((s) => Object.values(s.teams).filter((x)           => x.synced === false).length)
  const dirtyRCount  = useGameStore((s) => Object.values(s.rounds).filter((x)          => x.synced === false).length)
  const dirtyACount  = useGameStore((s) => Object.values(s.activities).filter((x)      => x.synced === false).length)
  const dirtyCsCount = useGameStore((s) => Object.values(s.categorySettings).filter((x) => (x as any).synced === false).length)
  const dirtyCount   = dirtyQCount + dirtySnCount + dirtyTCount + dirtyRCount + dirtyACount + dirtyCsCount

  const getDirtyPayload = useCallback((userId: string) => {
    const { sessions, teams, rounds, activities, customQuestions, categorySettings } = useGameStore.getState()
    return {
      userId,
      dirtyQuestions:         Object.values(customQuestions).filter((q)  => q.synced === false),
      dirtySessions:          Object.values(sessions).filter((s)          => s.synced === false),
      dirtyTeams:             Object.values(teams).filter((t)             => t.synced === false),
      dirtyRounds:            Object.values(rounds).filter((r)            => r.synced === false),
      dirtyActivities:        Object.values(activities).filter((a)        => a.synced === false),
      dirtyCategorySettings:  Object.values(categorySettings).filter((cs) => (cs as any).synced === false),
      lastPulledAt:           lastPulledAt ?? undefined,
    }
  }, [lastPulledAt])

  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured() || syncingRef.current) return
    if (!user) return   // must be authenticated to sync
    syncingRef.current = true
    setStatus('syncing')

    try {
      const payload = getDirtyPayload(user.id)
      const result  = await runSync(payload) as any

      if (result.errors.length > 0) {
        console.warn('[sync] errors:', result.errors)
        setStatus('error')
        return
      }

      const { markSynced, mergePulledQuestions, mergePulledCategorySettings } = useGameStore.getState()

      markSynced({
        questions:        payload.dirtyQuestions.map((q)         => q.id),
        sessions:         payload.dirtySessions.map((s)          => s.id),
        teams:            payload.dirtyTeams.map((t)             => t.id),
        rounds:           payload.dirtyRounds.map((r)            => r.id),
        activities:       payload.dirtyActivities.map((a)        => a.id),
        categorySettings: payload.dirtyCategorySettings.map((cs) => (cs as any).id),
      })

      if (result._pulled?.questions?.length) {
        mergePulledQuestions(result._pulled.questions)
      }
      if (result._pulled?.categorySettings?.length) {
        mergePulledCategorySettings(result._pulled.categorySettings)
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
  }, [user, getDirtyPayload])

  // Auto-sync when user logs in or on interval
  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return
    syncNow()
    const timer = setInterval(syncNow, SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [user?.id])

  return { status, lastSyncedAt, dirtyCount, syncNow, isConfigured: isSupabaseConfigured() }
}
