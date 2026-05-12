'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useImageGameStore } from '@/store/imageGameStore'
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
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [lastPulledAt, setLastPulledAt] = useState<number | null>(null)
  const syncingRef = useRef(false)

  const { user } = useAuth()

  // ── Trivia game dirty counts ───────────────────────────────────────────────
  const dirtyQCount  = useGameStore((s) => Object.values(s.customQuestions).filter((q) => q.synced === false).length)
  const dirtySnCount = useGameStore((s) => Object.values(s.sessions).filter((x)        => x.synced === false).length)
  const dirtyTCount  = useGameStore((s) => Object.values(s.teams).filter((x)           => x.synced === false).length)
  const dirtyRCount  = useGameStore((s) => Object.values(s.rounds).filter((x)          => x.synced === false).length)
  const dirtyACount  = useGameStore((s) => Object.values(s.activities).filter((x)      => x.synced === false).length)
  const dirtyCsCount = useGameStore((s) => Object.values(s.categorySettings).filter((x) => (x as any).synced === false).length)

  // ── Image game dirty counts ────────────────────────────────────────────────
  const dirtyIQCount = useImageGameStore((s) => Object.values(s.questions).filter((q) => q.synced === false).length)
  const dirtyISCount = useImageGameStore((s) => Object.values(s.sessions).filter((s2) => (s2 as any).synced === false).length)

  const dirtyCount =
    dirtyQCount + dirtySnCount + dirtyTCount + dirtyRCount + dirtyACount + dirtyCsCount +
    dirtyIQCount + dirtyISCount

  // ── getDirtyPayload reads from getState() at call time — no reactive dep ──
  const getDirtyPayload = useCallback((userId: string) => {
    const triviaStore = useGameStore.getState()
    const imageStore  = useImageGameStore.getState()
    const igDirty     = imageStore.getDirtyPayload()

    return {
      userId,
      dirtyQuestions:         Object.values(triviaStore.customQuestions).filter((q)  => q.synced === false),
      dirtySessions:          Object.values(triviaStore.sessions).filter((s)          => s.synced === false),
      dirtyTeams:             Object.values(triviaStore.teams).filter((t)             => t.synced === false),
      dirtyRounds:            Object.values(triviaStore.rounds).filter((r)            => r.synced === false),
      dirtyActivities:        Object.values(triviaStore.activities).filter((a)        => a.synced === false),
      dirtyCategorySettings:  Object.values(triviaStore.categorySettings).filter((cs) => (cs as any).synced === false),
      imageGame: {
        dirtyQuestions:  igDirty.dirtyQuestions,
        dirtySessions:   igDirty.dirtySessions,
        dirtyRounds:     igDirty.dirtyRounds,
        dirtyActivities: igDirty.dirtyActivities,
      },
      lastPulledAt: lastPulledAt ?? undefined,
    }
  }, [lastPulledAt])

  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured() || syncingRef.current) return
    if (!user) return
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

      // ── Mark trivia game records as synced ─────────────────────────────────
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

      // ── Mark image game records as synced ──────────────────────────────────
      const { markImageSynced, mergePulledImageQuestions } = useImageGameStore.getState()

      markImageSynced({
        questions: payload.imageGame.dirtyQuestions.map((q) => q.id),
        sessions:  payload.imageGame.dirtySessions.map((s)  => s.id),
      })

      if (result._pulled?.imageQuestions?.length) {
        mergePulledImageQuestions(result._pulled.imageQuestions)
      }

      const n = Date.now()
      setLastSyncedAt(n)
      setLastPulledAt(n)
      setStatus('ok')
    } catch (err) {
      console.error('[sync] unexpected error:', err)
      setStatus('error')
    } finally {
      syncingRef.current = false
    }
  }, [user, getDirtyPayload])

  // Auto-sync on mount when user logs in, then on interval
  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return
    syncNow()
    const timer = setInterval(syncNow, SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [user?.id])

  return { status, lastSyncedAt, dirtyCount, syncNow, isConfigured: isSupabaseConfigured() }
}
