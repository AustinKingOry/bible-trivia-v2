import { createClient } from '@supabase/supabase-js'
import type {
  Question, Session, Team, Round, Activity,
} from '@/types'

// ─── Database row shapes (snake_case, matching SQL schema) ────────────────────

export interface DbQuestion {
  id: string
  category_id: string
  difficulty: string
  question: string
  answer: string
  source: string
  tags: string[] | null
  quote_fields: Record<string, unknown> | null
  open_verse_fields: Record<string, unknown> | null
  true_false_fields: Record<string, unknown> | null
  hot_seat_fields: Record<string, unknown> | null
  ai_generated: boolean | null
  source_ref: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface DbSession {
  id: string
  name: string
  status: string
  active_round_id: string | null
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
  current_team_turn_id: string | null
  turn_started_at: number | null
  turn_expires_at: number | null
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
      activities: { Row: DbActivity;  Insert: DbActivity;  Update: Partial<DbActivity>  }
    }
  }
}

// ─── Client instances ─────────────────────────────────────────────────────────

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Browser-safe client (uses anon key) */
export const supabase = createClient<Database>(url, anon)

/** Server-side client (uses service role key — never import in client components) */
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
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
    synced:        true,
  }
}

export function questionToDb(q: Question): DbQuestion {
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
    ai_generated:     q.aiGenerated ?? null,
    source_ref:       q.sourceRef   ?? null,
    created_at:       q.createdAt,
    updated_at:       q.updatedAt,
    deleted_at:       q.deletedAt   ?? null,
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
  }
}

export function sessionToDb(s: Session): DbSession {
  return {
    id:              s.id,
    name:            s.name,
    status:          s.status,
    active_round_id: s.activeRoundId,
    created_at:      s.createdAt,
    updated_at:      s.updatedAt,
    deleted_at:      s.deletedAt ?? null,
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
  }
}

export function teamToDb(t: Team): DbTeam {
  return {
    id:         t.id,
    session_id: t.sessionId,
    name:       t.name,
    color:      t.color,
    players:    t.players,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
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
    currentTeamTurnId:  row.current_team_turn_id,
    turnStartedAt:      row.turn_started_at,
    turnExpiresAt:      row.turn_expires_at,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    deletedAt:          row.deleted_at ?? undefined,
    synced:             true,
  }
}

export function roundToDb(r: Round): DbRound {
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
    current_team_turn_id: r.currentTeamTurnId,
    turn_started_at:      r.turnStartedAt,
    turn_expires_at:      r.turnExpiresAt,
    created_at:           r.createdAt,
    updated_at:           r.updatedAt,
    deleted_at:           r.deletedAt ?? null,
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
  }
}

export function activityToDb(a: Activity): DbActivity {
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
  }
}
