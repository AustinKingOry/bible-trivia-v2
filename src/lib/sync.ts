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
  imageQuestionToDb, dbToImageQuestion,
  imageSessionToDb,
  imageParticipantToDb,
  imageRoundToDb,
  imageActivityToDb,
} from './supabase'
import type { Question, Session, Team, Round, Activity, CategorySettings } from '@/types'
import type {
  ImageQuestion, ImageSession, ImageParticipant, ImageRound, ImageActivity,
} from '@/types/imageGame'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok'

export interface SyncResult {
  pushedQuestions:        number
  pushedSessions:         number
  pushedTeams:            number
  pushedRounds:           number
  pushedActivities:       number
  pushedCategorySettings: number
  // Image game
  pushedImageQuestions:   number
  pushedImageSessions:    number
  pushedImageParticipants:number
  pushedImageRounds:      number
  pushedImageActivities:  number
  pulledQuestions:        number
  pulledCategorySettings: number
  pulledImageQuestions:   number
  errors:                 string[]
}

interface PulledData {
  questions:        Question[]
  categorySettings: CategorySettings[]
  imageQuestions:   ImageQuestion[]
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

export interface ImageGameSyncPayload {
  dirtySessions:    ImageSession[]
  dirtyRounds:      ImageRound[]
  dirtyActivities:  ImageActivity[]
  dirtyQuestions:   ImageQuestion[]
}

export interface SyncPayload {
  userId:                 string
  dirtyQuestions:         Question[]
  dirtySessions:          Session[]
  dirtyTeams:             Team[]
  dirtyRounds:            Round[]
  dirtyActivities:        Activity[]
  dirtyCategorySettings:  CategorySettings[]
  imageGame:              ImageGameSyncPayload
  lastPulledAt?:          number
}

export async function pullImageQuestions(
  userId: string, since?: number
): Promise<{ questions: ImageQuestion[]; error?: string }> {
  try {
    const client = getClient()
    let query = (client.from as any)('image_questions')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Pull own questions — future: could also pull public ones (user_id is null)
    if (since) query = query.gt('updated_at', since)

    const { data, error } = await query
    if (error) return { questions: [], error: error.message }
    return { questions: (data ?? []).map(dbToImageQuestion) }
  } catch {
    return { questions: [] }
  }
}

export async function runSync(payload: SyncPayload): Promise<InternalSyncResult> {
  const { userId } = payload
  const ig = payload.imageGame
  const result: SyncResult = {
    pushedQuestions: 0, pushedSessions: 0, pushedTeams: 0,
    pushedRounds: 0, pushedActivities: 0, pushedCategorySettings: 0,
    pushedImageQuestions: 0, pushedImageSessions: 0,
    pushedImageParticipants: 0, pushedImageRounds: 0, pushedImageActivities: 0,
    pulledQuestions: 0, pulledCategorySettings: 0, pulledImageQuestions: 0,
    errors: [],
  }

  // Build image participant rows — flatten from sessions
  const igParticipantRows = ig.dirtySessions.flatMap((s, _i) =>
    s.participants.map((p, idx) => imageParticipantToDb(p, s.id, idx, userId))
  )

  // ── PUSH all dirty records (parallel) ─────────────────────────────────────
  const [qErr, sErr, tErr, rErr, aErr, csErr,
         iqErr, isErr, ipErr, irErr, iaErr] = await Promise.all([
    // Trivia game
    pushRows('questions',        payload.dirtyQuestions.map((q)  => questionToDb(q, userId))),
    pushRows('sessions',         payload.dirtySessions.map((s)   => sessionToDb(s, userId))),
    pushRows('teams',            payload.dirtyTeams.map((t)      => teamToDb(t, userId))),
    pushRows('rounds',           payload.dirtyRounds.map((r)     => roundToDb(r, userId))),
    pushRows('activities',       payload.dirtyActivities.map((a) => activityToDb(a, userId))),
    pushRows('category_settings', payload.dirtyCategorySettings.map((cs) => categorySettingsToDb(cs, userId))),
    // Image game
    pushRows('image_questions',    ig.dirtyQuestions.map((q) => imageQuestionToDb(q, userId))),
    pushRows('image_sessions',     ig.dirtySessions.map((s) => imageSessionToDb(s, userId))),
    pushRows('image_participants', igParticipantRows),
    pushRows('image_rounds',       ig.dirtyRounds.map((r) => imageRoundToDb(r, userId))),
    pushRows('image_activities',   ig.dirtyActivities.map((a) => imageActivityToDb(a, userId))),
  ])

  // Trivia game push results
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

  // Image game push results
  if (iqErr) result.errors.push(`ImageQuestions: ${iqErr}`)
  else result.pushedImageQuestions = ig.dirtyQuestions.length
  if (isErr) result.errors.push(`ImageSessions: ${isErr}`)
  else result.pushedImageSessions = ig.dirtySessions.length
  if (ipErr) result.errors.push(`ImageParticipants: ${ipErr}`)
  else result.pushedImageParticipants = igParticipantRows.length
  if (irErr) result.errors.push(`ImageRounds: ${irErr}`)
  else result.pushedImageRounds = ig.dirtyRounds.length
  if (iaErr) result.errors.push(`ImageActivities: ${iaErr}`)
  else result.pushedImageActivities = ig.dirtyActivities.length

  // ── PULL (parallel) ────────────────────────────────────────────────────────
  const [
    { questions: pulledQ,  error: pullQErr },
    { categorySettings: pulledCS, error: pullCSErr },
    { questions: pulledIQ, error: pullIQErr },
  ] = await Promise.all([
    pullQuestions(userId, payload.lastPulledAt),
    pullCategorySettings(userId, payload.lastPulledAt),
    pullImageQuestions(userId, payload.lastPulledAt),
  ])

  if (pullQErr)  result.errors.push(`Pull questions: ${pullQErr}`)
  else result.pulledQuestions = pulledQ.length
  if (pullCSErr) result.errors.push(`Pull category settings: ${pullCSErr}`)
  else result.pulledCategorySettings = pulledCS.length
  if (pullIQErr) result.errors.push(`Pull image questions: ${pullIQErr}`)
  else result.pulledImageQuestions = pulledIQ.length

  return { ...result, _pulled: { questions: pulledQ, categorySettings: pulledCS, imageQuestions: pulledIQ } }
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
