import { createClient } from '@supabase/supabase-js'
import type {
  Question, Session, Team, Round, Activity,
} from '@/types'

// ─── Image Game mappers ───────────────────────────────────────────────────────

import type {
  ImageQuestion, ImageSession, ImageParticipant, ImageRound, ImageActivity,
} from '@/types/imageGame'

// ─── Database row shapes (snake_case, matching SQL schema) ────────────────────

export interface DbQuestion {
  id: string
  category_id: string
  difficulty: string
  question: string
  answer: string
  source: string
  tags: string[] | null
  topic_tag: string | null
  quote_fields: Record<string, unknown> | null
  open_verse_fields: Record<string, unknown> | null
  true_false_fields: Record<string, unknown> | null
  hot_seat_fields: Record<string, unknown> | null
  ai_generated: boolean | null
  source_ref: string | null
  created_at: number
  updated_at: number
  user_id: string | null
  deleted_at: number | null
}

export interface DbSession {
  id: string
  name: string
  status: string
  active_round_id: string | null
  user_id: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbTeam {
  id: string
  session_id: string
  name: string
  color: string
  players: string[]
  user_id: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbRound {
  id: string
  session_id: string
  name: string
  category_id: string
  difficulty: string
  status: string
  question_limit: number | null
  question_queue: string[]
  question_index: number
  topic_tag: string | null
  current_team_turn_id: string | null
  turn_started_at: number | null
  turn_expires_at: number | null
  user_id: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbActivity {
  id: string
  session_id: string
  round_id: string
  team_id: string
  question_id: string
  points: number
  reason: string
  user_id: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface Database {
  public: {
    Tables: {
      questions:  { Row: DbQuestion;  Insert: DbQuestion;  Update: Partial<DbQuestion>  }
      sessions:   { Row: DbSession;   Insert: DbSession;   Update: Partial<DbSession>   }
      teams:      { Row: DbTeam;      Insert: DbTeam;      Update: Partial<DbTeam>      }
      rounds:     { Row: DbRound;     Insert: DbRound;     Update: Partial<DbRound>     }
      activities:          { Row: DbActivity;         Insert: DbActivity;         Update: Partial<DbActivity>         }
      category_settings:   { Row: DbCategorySettings; Insert: DbCategorySettings; Update: Partial<DbCategorySettings> }
    }
  }
}

export interface DbCategorySettings {
  id: string
  user_id: string
  category_id: string
  points_correct: number
  points_wrong: number
  steal_points: number
  answer_time_secs: number
  steal_time_secs: number
  hot_seat_time_secs: number
  created_at: number
  updated_at: number
  deleted_at: number | null
}

// ─── Client instances ─────────────────────────────────────────────────────────

function getUrl()  { return process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '' }
function getAnon() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' }

function isConfigured() {
  const url = getUrl()
  return !!url && url.startsWith('http') && !url.includes('your-project-ref')
}

/** Lazy singleton — created on first call, only when env vars are present */
let _browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!isConfigured()) return null
  if (!_browserClient) {
    _browserClient = createClient<Database>(getUrl(), getAnon())
  }
  return _browserClient
}

/** Convenience: same as getSupabaseClient() but throws if not configured */
export function requireSupabaseClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase is not configured. Add keys to .env.local.')
  return client
}

/**
 * Direct supabase client — use getSupabaseClient() which returns null when not configured.
 * This alias calls getSupabaseClient() lazily; safe to import anywhere.
 * Will return null (not throw) if Supabase env vars are missing.
 */
export function getSupabase() {
  return getSupabaseClient()
}

/** Server-side client (uses service role key — never import in client components) */
export function createServerClient() {
  const url        = getUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !url.startsWith('http')) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  })
}

// ─── Row ↔ Domain mappers ─────────────────────────────────────────────────────

export function dbToQuestion(row: DbQuestion): Question {
  return {
    id:            row.id,
    categoryId:    row.category_id,
    difficulty:    row.difficulty as Question['difficulty'],
    question:      row.question,
    answer:        row.answer,
    source:        row.source as Question['source'],
    tags:          row.tags ?? undefined,
    quoteFields:   row.quote_fields as unknown    as Question['quoteFields']    ?? undefined,
    openVerseFields: row.open_verse_fields as unknown as Question['openVerseFields'] ?? undefined,
    trueFalseFields: row.true_false_fields as unknown as Question['trueFalseFields'] ?? undefined,
    hotSeatFields: row.hot_seat_fields as unknown as Question['hotSeatFields'] ?? undefined,
    aiGenerated:   row.ai_generated    ?? undefined,
    sourceRef:     row.source_ref      ?? undefined,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    deletedAt:     row.deleted_at      ?? undefined,
    topicTag:      row.topic_tag ?? undefined,
    synced:        true,
    userId:        row.user_id ?? undefined,
  }
}

export function questionToDb(q: Question, userId?: string): DbQuestion {
  return {
    id:               q.id,
    category_id:      q.categoryId,
    difficulty:       q.difficulty,
    question:         q.question,
    answer:           q.answer,
    source:           q.source,
    tags:             q.tags ?? null,
    quote_fields:     q.quoteFields     ? { ...q.quoteFields }     : null,
    open_verse_fields: q.openVerseFields ? { ...q.openVerseFields } : null,
    true_false_fields: q.trueFalseFields ? { ...q.trueFalseFields } : null,
    hot_seat_fields:  q.hotSeatFields   ? { ...q.hotSeatFields }   : null,
    topic_tag:        q.topicTag    ?? null,
    ai_generated:     q.aiGenerated ?? null,
    source_ref:       q.sourceRef   ?? null,
    created_at:       q.createdAt,
    updated_at:       q.updatedAt,
    deleted_at:       q.deletedAt   ?? null,
    user_id:          userId ?? null,
  }
}

export function dbToSession(row: DbSession): Session {
  return {
    id:            row.id,
    name:          row.name,
    status:        row.status as Session['status'],
    activeRoundId: row.active_round_id,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    deletedAt:     row.deleted_at ?? undefined,
    synced:        true,
    userId:        row.user_id ?? undefined,
  }
}

export function sessionToDb(s: Session, userId?: string): DbSession {
  return {
    id:              s.id,
    name:            s.name,
    status:          s.status,
    active_round_id: s.activeRoundId,
    created_at:      s.createdAt,
    updated_at:      s.updatedAt,
    deleted_at:      s.deletedAt ?? null,
    user_id:         userId ?? null,
  }
}

export function dbToTeam(row: DbTeam): Team {
  return {
    id:        row.id,
    sessionId: row.session_id,
    name:      row.name,
    color:     row.color,
    players:   row.players,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    synced:    true,
    userId:    row.user_id ?? undefined,
  }
}

export function teamToDb(t: Team, userId?: string): DbTeam {
  return {
    id:         t.id,
    session_id: t.sessionId,
    name:       t.name,
    color:      t.color,
    players:    t.players,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
    user_id:    userId ?? null,
  }
}

export function dbToRound(row: DbRound): Round {
  return {
    id:                 row.id,
    sessionId:          row.session_id,
    name:               row.name,
    categoryId:         row.category_id,
    difficulty:         row.difficulty as Round['difficulty'],
    status:             row.status as Round['status'],
    questionLimit:      row.question_limit ?? undefined,
    questionQueue:      row.question_queue,
    questionIndex:      row.question_index,
    topicTag:           row.topic_tag ?? undefined,
    currentTeamTurnId:  row.current_team_turn_id,
    turnStartedAt:      row.turn_started_at,
    turnExpiresAt:      row.turn_expires_at,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    deletedAt:          row.deleted_at ?? undefined,
    synced:             true,
    userId:             row.user_id ?? undefined,
  }
}

export function roundToDb(r: Round, userId?: string): DbRound {
  return {
    id:                   r.id,
    session_id:           r.sessionId,
    name:                 r.name,
    category_id:          r.categoryId,
    difficulty:           r.difficulty,
    status:               r.status,
    question_limit:       r.questionLimit ?? null,
    question_queue:       r.questionQueue,
    question_index:       r.questionIndex,
    topic_tag:            r.topicTag ?? null,
    current_team_turn_id: r.currentTeamTurnId,
    turn_started_at:      r.turnStartedAt,
    turn_expires_at:      r.turnExpiresAt,
    created_at:           r.createdAt,
    updated_at:           r.updatedAt,
    deleted_at:           r.deletedAt ?? null,
    user_id:              userId ?? null,
  }
}

export function dbToActivity(row: DbActivity): Activity {
  return {
    id:          row.id,
    sessionId:   row.session_id,
    roundId:     row.round_id,
    teamId:      row.team_id,
    questionId:  row.question_id,
    points:      row.points,
    reason:      row.reason as Activity['reason'],
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
    deletedAt:   row.deleted_at ?? undefined,
    synced:      true,
    userId:      row.user_id ?? undefined,
  }
}

export function activityToDb(a: Activity, userId?: string): DbActivity {
  return {
    id:          a.id,
    session_id:  a.sessionId,
    round_id:    a.roundId,
    team_id:     a.teamId,
    question_id: a.questionId,
    points:      a.points,
    reason:      a.reason,
    created_at:  a.createdAt,
    updated_at:  a.updatedAt,
    deleted_at:  a.deletedAt ?? null,
    user_id:     userId ?? null,
  }
}

export function dbToCategorySettings(row: DbCategorySettings): import('@/types').CategorySettings {
  return {
    id:               row.id,
    categoryId:       row.category_id,
    userId:           row.user_id,
    pointsCorrect:    row.points_correct,
    pointsWrong:      row.points_wrong,
    stealPoints:      row.steal_points,
    answerTimeSecs:   row.answer_time_secs,
    stealTimeSecs:    row.steal_time_secs,
    hotSeatTimeSecs:  row.hot_seat_time_secs,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
    synced:           true,
  }
}

export function categorySettingsToDb(cs: import('@/types').CategorySettings, userId: string): DbCategorySettings {
  return {
    id:                  cs.id,
    user_id:             userId,
    category_id:         cs.categoryId,
    points_correct:      cs.pointsCorrect,
    points_wrong:        cs.pointsWrong,
    steal_points:        cs.stealPoints,
    answer_time_secs:    cs.answerTimeSecs,
    steal_time_secs:     cs.stealTimeSecs,
    hot_seat_time_secs:  cs.hotSeatTimeSecs,
    created_at:          cs.createdAt,
    updated_at:          cs.updatedAt,
    deleted_at:          null,
  }
}

// ─── Image Game DB interfaces ─────────────────────────────────────────────────

export interface DbImageQuestion {
  id: string
  user_id: string | null
  image_url: string
  answer: string
  hint: string | null
  topic_tag: string | null
  difficulty: string
  source: string
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbImageSession {
  id: string
  user_id: string | null
  name: string
  participant_mode: string
  status: string
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbImageParticipant {
  id: string
  user_id: string | null
  session_id: string
  name: string
  type: string
  members: string[]
  color: string
  score: number
  sort_order: number
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbImageRound {
  id: string
  user_id: string | null
  session_id: string
  name: string
  topic_tag: string | null
  difficulty: string | null
  status: string
  question_queue: string[]
  question_index: number
  participant_queue: string[]
  answer_time_secs: number
  points_correct: number
  points_wrong: number
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbImageActivity {
  id: string
  user_id: string | null
  session_id: string
  round_id: string
  question_id: string
  participant_id: string
  result: string
  points: number
  created_at: number
}

export function dbToImageQuestion(row: DbImageQuestion): ImageQuestion {
  return {
    id:         row.id,
    imageUrl:   row.image_url,
    answer:     row.answer,
    hint:       row.hint ?? undefined,
    topicTag:   row.topic_tag ?? undefined,
    difficulty: row.difficulty as ImageQuestion['difficulty'],
    source:     row.source as ImageQuestion['source'],
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
    deletedAt:  row.deleted_at ?? undefined,
    synced:     true,
  }
}

export function imageQuestionToDb(q: ImageQuestion, userId?: string): DbImageQuestion {
  return {
    id:         q.id,
    user_id:    userId ?? null,
    image_url:  q.imageUrl,
    answer:     q.answer,
    hint:       q.hint ?? null,
    topic_tag:  q.topicTag ?? null,
    difficulty: q.difficulty,
    source:     q.source,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
    deleted_at: q.deletedAt ?? null,
  }
}

export function dbToImageSession(row: DbImageSession): ImageSession {
  return {
    id:              row.id,
    name:            row.name,
    participantMode: row.participant_mode as ImageSession['participantMode'],
    status:          row.status as ImageSession['status'],
    participants:    [],   // loaded separately from image_participants
    rounds:          [],   // loaded separately from image_rounds
    activities:      [],   // loaded separately from image_activities
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
    synced:          true,
  }
}

export function imageSessionToDb(s: ImageSession, userId?: string): DbImageSession {
  return {
    id:               s.id,
    user_id:          userId ?? null,
    name:             s.name,
    participant_mode: s.participantMode,
    status:           s.status,
    created_at:       s.createdAt,
    updated_at:       s.updatedAt,
    deleted_at:       null,
  }
}

export function dbToImageParticipant(row: DbImageParticipant): ImageParticipant {
  return {
    id:      row.id,
    name:    row.name,
    type:    row.type as ImageParticipant['type'],
    members: row.members ?? [],
    color:   row.color,
    score:   row.score,
  }
}

export function imageParticipantToDb(
  p: ImageParticipant,
  sessionId: string,
  sortOrder: number,
  userId?: string
): DbImageParticipant {
  return {
    id:         p.id,
    user_id:    userId ?? null,
    session_id: sessionId,
    name:       p.name,
    type:       p.type,
    members:    p.members ?? [],
    color:      p.color,
    score:      p.score,
    sort_order: sortOrder,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  }
}

export function dbToImageRound(row: DbImageRound): ImageRound {
  return {
    id:               row.id,
    sessionId:        row.session_id,
    name:             row.name,
    topicTag:         row.topic_tag ?? undefined,
    difficulty:       (row.difficulty ?? 'all') as ImageRound['difficulty'],
    status:           row.status as ImageRound['status'],
    questionQueue:    row.question_queue,
    questionIndex:    row.question_index,
    participantQueue: row.participant_queue,
    answerTimeSecs:   row.answer_time_secs,
    pointsCorrect:    row.points_correct,
    pointsWrong:      row.points_wrong,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
    synced:           true,
  }
}

export function imageRoundToDb(r: ImageRound, userId?: string): DbImageRound {
  return {
    id:               r.id,
    user_id:          userId ?? null,
    session_id:       r.sessionId,
    name:             r.name,
    topic_tag:        r.topicTag ?? null,
    difficulty:       r.difficulty ?? 'all',
    status:           r.status,
    question_queue:   r.questionQueue,
    question_index:   r.questionIndex,
    participant_queue: r.participantQueue,
    answer_time_secs: r.answerTimeSecs,
    points_correct:   r.pointsCorrect,
    points_wrong:     r.pointsWrong,
    created_at:       r.createdAt,
    updated_at:       r.updatedAt,
    deleted_at:       null,
  }
}

export function dbToImageActivity(row: DbImageActivity): ImageActivity {
  return {
    id:            row.id,
    sessionId:     row.session_id,
    roundId:       row.round_id,
    questionId:    row.question_id,
    participantId: row.participant_id,
    result:        row.result as ImageActivity['result'],
    points:        row.points,
    createdAt:     row.created_at,
    synced:        true,
  }
}

export function imageActivityToDb(a: ImageActivity, userId?: string): DbImageActivity {
  return {
    id:             a.id,
    user_id:        userId ?? null,
    session_id:     a.sessionId,
    round_id:       a.roundId,
    question_id:    a.questionId,
    participant_id: a.participantId,
    result:         a.result,
    points:         a.points,
    created_at:     a.createdAt,
  }
}