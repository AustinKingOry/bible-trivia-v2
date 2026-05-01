/**
 * sync.ts — Offline-first sync engine
 *
 * Strategy:
 *   PUSH: find records with synced=false in the local store, upsert to Supabase,
 *         then mark them synced=true locally.
 *   PULL: fetch all questions from Supabase that are newer than our last pull,
 *         merge into customQuestions store.
 *
 * Only questions are pull-synced (shared across devices).
 * Sessions/teams/rounds/activities are push-only (per-device game data).
 */

import { supabase, questionToDb, dbToQuestion, sessionToDb, teamToDb, roundToDb, activityToDb } from './supabase'
import type { Question, Session, Team, Round, Activity } from '@/types'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok'

export interface SyncResult {
  pushedQuestions: number
  pushedSessions:  number
  pushedTeams:     number
  pushedRounds:    number
  pushedActivities: number
  pulledQuestions: number
  errors: string[]
}

// ─── PUSH ─────────────────────────────────────────────────────────────────────

async function pushQuestions(dirty: Question[]): Promise<{ synced: string[]; error?: string }> {
  if (!dirty.length) return { synced: [] }
  const rows = dirty.map(questionToDb)
  const { error } = await supabase.from('questions').upsert(rows as any, { onConflict: 'id' })
  if (error) return { synced: [], error: error.message }
  return { synced: dirty.map((q) => q.id) }
}

async function pushSessions(dirty: Session[]): Promise<{ synced: string[]; error?: string }> {
  if (!dirty.length) return { synced: [] }
  const rows = dirty.map(sessionToDb)
  const { error } = await supabase.from('sessions').upsert(rows as any, { onConflict: 'id' })
  if (error) return { synced: [], error: error.message }
  return { synced: dirty.map((s) => s.id) }
}

async function pushTeams(dirty: Team[]): Promise<{ synced: string[]; error?: string }> {
  if (!dirty.length) return { synced: [] }
  const rows = dirty.map(teamToDb)
  const { error } = await supabase.from('teams').upsert(rows as any, { onConflict: 'id' })
  if (error) return { synced: [], error: error.message }
  return { synced: dirty.map((t) => t.id) }
}

async function pushRounds(dirty: Round[]): Promise<{ synced: string[]; error?: string }> {
  if (!dirty.length) return { synced: [] }
  const rows = dirty.map(roundToDb)
  const { error } = await supabase.from('rounds').upsert(rows as any, { onConflict: 'id' })
  if (error) return { synced: [], error: error.message }
  return { synced: dirty.map((r) => r.id) }
}

async function pushActivities(dirty: Activity[]): Promise<{ synced: string[]; error?: string }> {
  if (!dirty.length) return { synced: [] }
  const rows = dirty.map(activityToDb)
  const { error } = await supabase.from('activities').upsert(rows as any, { onConflict: 'id' })
  if (error) return { synced: [], error: error.message }
  return { synced: dirty.map((a) => a.id) }
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

/**
 * Pull all non-deleted custom questions (source != 'seed') from Supabase.
 * Returns Question[] ready to merge into the store's customQuestions.
 */
export async function pullQuestions(since?: number): Promise<{ questions: Question[]; error?: string }> {
  let query = supabase
    .from('questions')
    .select('*')
    .is('deleted_at', null)
    .neq('source', 'seed')
    .order('created_at', { ascending: true })

  if (since) {
    query = query.gt('updated_at', since)
  }

  const { data, error } = await query
  if (error) return { questions: [], error: error.message }
  return { questions: (data ?? []).map(dbToQuestion) }
}

// ─── MAIN SYNC ────────────────────────────────────────────────────────────────

export interface SyncPayload {
  dirtyQuestions:  Question[]
  dirtySessions:   Session[]
  dirtyTeams:      Team[]
  dirtyRounds:     Round[]
  dirtyActivities: Activity[]
  lastPulledAt?:   number
}

interface InternalSyncResult extends SyncResult { _pulled: Question[] }

export async function runSync(payload: SyncPayload): Promise<InternalSyncResult> {
  const result: SyncResult = {
    pushedQuestions: 0, pushedSessions: 0, pushedTeams: 0,
    pushedRounds: 0, pushedActivities: 0, pulledQuestions: 0,
    errors: [],
  }

  // ── PUSH (parallel) ────────────────────────────────────────────────────────
  const [qRes, sRes, tRes, rRes, aRes] = await Promise.all([
    pushQuestions(payload.dirtyQuestions),
    pushSessions(payload.dirtySessions),
    pushTeams(payload.dirtyTeams),
    pushRounds(payload.dirtyRounds),
    pushActivities(payload.dirtyActivities),
  ])

  if (qRes.error) result.errors.push(`Questions: ${qRes.error}`)
  else result.pushedQuestions = qRes.synced.length

  if (sRes.error) result.errors.push(`Sessions: ${sRes.error}`)
  else result.pushedSessions = sRes.synced.length

  if (tRes.error) result.errors.push(`Teams: ${tRes.error}`)
  else result.pushedTeams = tRes.synced.length

  if (rRes.error) result.errors.push(`Rounds: ${rRes.error}`)
  else result.pushedRounds = rRes.synced.length

  if (aRes.error) result.errors.push(`Activities: ${aRes.error}`)
  else result.pushedActivities = aRes.synced.length

  // ── PULL questions ─────────────────────────────────────────────────────────
  const { questions: pulled, error: pullErr } = await pullQuestions(payload.lastPulledAt)
  if (pullErr) result.errors.push(`Pull: ${pullErr}`)
  else result.pulledQuestions = pulled.length

  return { ...result, _pulled: pulled }
}

// ─── QUESTION-ONLY HELPERS (for Questions page sync button) ───────────────────

export async function pushSingleQuestion(q: Question): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('questions')
    .upsert(questionToDb(q) as any, { onConflict: 'id' })
  return { ok: !error, error: error?.message }
}

export async function deleteSingleQuestion(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('questions')
    .update({ deleted_at: Date.now() } as never)
    .eq('id', id)
  return { ok: !error, error: error?.message }
}

export async function fetchAllRemoteQuestions(): Promise<{ questions: Question[]; error?: string }> {
  return pullQuestions()
}
