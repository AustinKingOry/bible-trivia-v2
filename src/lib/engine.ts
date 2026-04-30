import type { Activity, TeamScore, Team } from '@/types'
import { SEED_QUESTIONS } from './data'

// ─── ID generation ────────────────────────────────────────────────────────────
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function now(): number {
  return Date.now()
}

// ─── Randomisation ────────────────────────────────────────────────────────────
export function fisherYates<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function buildQuestionQueue(categoryId: string, difficulty: string): string[] {
  const filtered = SEED_QUESTIONS.filter(
    (q) => q.categoryId === categoryId && q.difficulty === difficulty
  )
  return fisherYates(filtered).map((q) => q.id)
}

export function getAvailableCount(categoryId: string, difficulty: string): number {
  return SEED_QUESTIONS.filter(
    (q) => q.categoryId === categoryId && q.difficulty === difficulty
  ).length
}

// ─── Score derivation (never stored directly) ─────────────────────────────────
export function deriveTeamScore(teamId: string, activities: Activity[]): number {
  return activities
    .filter((a) => a.teamId === teamId)
    .reduce((sum, a) => sum + a.points, 0)
}

export function deriveLeaderboard(
  teams: Team[],
  activities: Activity[],
  sessionId?: string,
  roundId?: string
): TeamScore[] {
  const filtered = activities.filter((a) => {
    if (sessionId && a.sessionId !== sessionId) return false
    if (roundId && a.roundId !== roundId) return false
    return true
  })

  const scored = teams.map((team) => ({
    team,
    score: deriveTeamScore(team.id, filtered),
    rank: 0,
  }))

  scored.sort((a, b) => b.score - a.score)
  scored.forEach((item, i) => { item.rank = i + 1 })
  return scored
}

// ─── Turn helpers ─────────────────────────────────────────────────────────────
export function getNextTeamId(teams: Team[], currentTeamId: string): string {
  const idx = teams.findIndex((t) => t.id === currentTeamId)
  if (idx === -1) return teams[0]?.id ?? ''
  return teams[(idx + 1) % teams.length].id
}

// ─── Sync helpers (stub — ready for Supabase) ─────────────────────────────────
export function markDirty<T extends { updatedAt: number; synced?: boolean }>(entity: T): T {
  return { ...entity, updatedAt: now(), synced: false }
}
