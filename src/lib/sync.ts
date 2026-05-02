/**
 * sync.ts — Offline-first sync engine (browser-only)
 *
 * Never import in Server Components or API routes.
 * All Supabase calls go through getSupabaseClient() which is lazy and null-safe.
 */

import {
  getSupabaseClient,
  questionToDb, dbToQuestion,
  sessionToDb, teamToDb, roundToDb, activityToDb,
  categorySettingsToDb, dbToCategorySettings,
} from './supabase'
import type { Question, Session, Team, Round, Activity, CategorySettings } from '@/types'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok'

export interface SyncResult {
  pushedQuestions:        number
  pushedSessions:         number
  pushedTeams:            number
  pushedRounds:           number
  pushedActivities:       number
  pushedCategorySettings: number
  pulledQuestions:        number
  pulledCategorySettings: number
  errors:                 string[]
}

interface PulledData {
  questions:        Question[]
  categorySettings: CategorySettings[]
}

interface InternalSyncResult extends SyncResult {
  _pulled: PulledData
}

// ─── Lazy client guard ────────────────────────────────────────────────────────

function getClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase not configured')
  return client
}

// ─── Generic push ─────────────────────────────────────────────────────────────

async function pushRows(table: string, rows: unknown[]): Promise<string | undefined> {
  if (!rows.length) return undefined
  const client = getClient()
  const { error } = await (client.from as any)(table).upsert(rows, { onConflict: 'id' })
  return error?.message
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

export async function pullQuestions(
  userId: string, since?: number
): Promise<{ questions: Question[]; error?: string }> {
  try {
    const client = getClient()
    let query = client
      .from('questions')
      .select('*')
      .is('deleted_at', null)
      .neq('source', 'seed')
      .order('created_at', { ascending: true })

    // Pull own questions + any public questions (user_id null = shared)
    if (since) query = (query as any).gt('updated_at', since)

    const { data, error } = await query
    if (error) return { questions: [], error: error.message }
    return { questions: (data ?? []).map(dbToQuestion) }
  } catch {
    return { questions: [] }
  }
}

export async function pullCategorySettings(
  userId: string, since?: number
): Promise<{ categorySettings: CategorySettings[]; error?: string }> {
  try {
    const client = getClient()
    let query = (client.from as any)('category_settings')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (since) query = query.gt('updated_at', since)

    const { data, error } = await query
    if (error) return { categorySettings: [], error: error.message }
    return { categorySettings: (data ?? []).map(dbToCategorySettings) }
  } catch {
    return { categorySettings: [] }
  }
}

// ─── MAIN SYNC ────────────────────────────────────────────────────────────────

export interface SyncPayload {
  userId:                 string
  dirtyQuestions:         Question[]
  dirtySessions:          Session[]
  dirtyTeams:             Team[]
  dirtyRounds:            Round[]
  dirtyActivities:        Activity[]
  dirtyCategorySettings:  CategorySettings[]
  lastPulledAt?:          number
}

export async function runSync(payload: SyncPayload): Promise<InternalSyncResult> {
  const { userId } = payload
  const result: SyncResult = {
    pushedQuestions: 0, pushedSessions: 0, pushedTeams: 0,
    pushedRounds: 0, pushedActivities: 0, pushedCategorySettings: 0,
    pulledQuestions: 0, pulledCategorySettings: 0,
    errors: [],
  }

  // ── PUSH all dirty records (parallel) ─────────────────────────────────────
  const [qErr, sErr, tErr, rErr, aErr, csErr] = await Promise.all([
    pushRows('questions',        payload.dirtyQuestions.map((q)  => questionToDb(q, userId))),
    pushRows('sessions',         payload.dirtySessions.map((s)   => sessionToDb(s, userId))),
    pushRows('teams',            payload.dirtyTeams.map((t)      => teamToDb(t, userId))),
    pushRows('rounds',           payload.dirtyRounds.map((r)     => roundToDb(r, userId))),
    pushRows('activities',       payload.dirtyActivities.map((a) => activityToDb(a, userId))),
    pushRows('category_settings', payload.dirtyCategorySettings.map((cs) => categorySettingsToDb(cs, userId))),
  ])

  if (qErr)  result.errors.push(`Questions: ${qErr}`)
  else result.pushedQuestions = payload.dirtyQuestions.length

  if (sErr)  result.errors.push(`Sessions: ${sErr}`)
  else result.pushedSessions = payload.dirtySessions.length

  if (tErr)  result.errors.push(`Teams: ${tErr}`)
  else result.pushedTeams = payload.dirtyTeams.length

  if (rErr)  result.errors.push(`Rounds: ${rErr}`)
  else result.pushedRounds = payload.dirtyRounds.length

  if (aErr)  result.errors.push(`Activities: ${aErr}`)
  else result.pushedActivities = payload.dirtyActivities.length

  if (csErr) result.errors.push(`CategorySettings: ${csErr}`)
  else result.pushedCategorySettings = payload.dirtyCategorySettings.length

  // ── PULL (parallel) ────────────────────────────────────────────────────────
  const [
    { questions: pulledQ,  error: pullQErr },
    { categorySettings: pulledCS, error: pullCSErr },
  ] = await Promise.all([
    pullQuestions(userId, payload.lastPulledAt),
    pullCategorySettings(userId, payload.lastPulledAt),
  ])

  if (pullQErr)  result.errors.push(`Pull questions: ${pullQErr}`)
  else result.pulledQuestions = pulledQ.length

  if (pullCSErr) result.errors.push(`Pull category settings: ${pullCSErr}`)
  else result.pulledCategorySettings = pulledCS.length

  return { ...result, _pulled: { questions: pulledQ, categorySettings: pulledCS } }
}

// ─── Per-question helpers ─────────────────────────────────────────────────────

export async function pushSingleQuestion(
  q: Question, userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient()
    const { error } = await client
      .from('questions')
      .upsert(questionToDb(q, userId) as never, { onConflict: 'id' } as any)
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteSingleQuestion(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient()
    const { error } = await client
      .from('questions')
      .update({ deleted_at: Date.now() } as never)
      .eq('id', id)
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
