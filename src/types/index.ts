// ─── Sync-ready base ─────────────────────────────────────────────────────────
export interface SyncBase {
  id: string
  userId?: string           // auth.uid() — undefined for anonymous/local-only records
  createdAt: number
  updatedAt: number
  synced?: boolean
  deletedAt?: number
}

// ─── Enums / unions ───────────────────────────────────────────────────────────
export type Difficulty    = 'all' | 'easy' | 'medium' | 'hard'
export type TurnMode      = 'per-question-rotation' | 'continuous'
export type AnswerResult  = 'correct' | 'wrong' | 'pass' | 'steal'
export type ActivityReason= 'correct' | 'wrong' | 'steal'
export type RoundStatus   = 'pending' | 'active' | 'completed'
export type SessionStatus = 'setup' | 'active' | 'ended'
export type QuestionSource= 'seed' | 'manual' | 'ai'

/**
 * QuestionType = the FORMAT / MECHANICS of the question.
 * Controls which add-form, scoring rules and turn mode apply.
 * This is what the old "categoryId" was on CATEGORIES in data.ts.
 */
export type QuestionType =
  | 'quote'
  | 'general'
  | 'character'
  | 'hotseat'
  | 'openverse'
  | 'truefalse'

/**
 * TopicTag = the SUBJECT MATTER of the question.
 * Stored as a free-form string; predefined tags are suggestions only.
 * Users can create their own tags on-the-fly.
 * Examples: 'bible', 'science', 'nature', 'technology', 'history', 'sport'
 */
export type TopicTag = string

/**
 * Per-question phase state machine (non-hotseat categories):
 *
 *  team1-answering  → Active team has answerTimeSecs to respond
 *       │ CORRECT        → done (award pointsCorrect to team1)
 *       │ WRONG          → steal-offered (deduct from team1 if applicable)
 *       │ PASS           → steal-offered (no deduction)
 *       │ timer expires  → steal-offered (auto, answer revealed)
 *       ▼
 *  steal-offered    → Steal button lit up; admin picks which opponent steals
 *       │ admin clicks STEAL (picks team2) → team2-answering (stealTimeSecs)
 *       │ NEXT (no steal taken)            → done
 *       ▼
 *  team2-answering  → Opponent has stealTimeSecs; NO pass, NO further steal
 *       │ CORRECT   → done (award stealPoints to team2)
 *       │ WRONG     → done (no points; optional deduct off team2)
 *       │ timer expires → done
 *       ▼
 *  done             → Question resolved, admin clicks Next Question
 *
 * Hot seat uses none of this — it runs a single session countdown.
 */
export type QuestionPhase =
  | 'team1-answering'
  | 'steal-offered'
  | 'team2-answering'
  | 'done'

/** @deprecated use QuestionPhase */
export type TimerPhase = QuestionPhase

// ─── Per-category admin-configurable settings ─────────────────────────────────
export interface CategorySettings {
  id: string                // uid — needed for DB upsert
  categoryId: string
  userId?: string           // auth.uid()

  // Scoring
  pointsCorrect: number
  pointsWrong: number      // negative = deduction, 0 = no penalty
  stealPoints: number

  // Timers — non-hotseat
  answerTimeSecs: number   // how long the active team has to answer
  stealTimeSecs: number    // how long opponents have to steal after time expires

  // Hot Seat only
  hotSeatTimeSecs: number  // total session duration for the hot-seat round

  // Sync
  createdAt: number
  updatedAt: number
  synced?: boolean
}

// ─── Category-specific question fields ───────────────────────────────────────
export interface QuoteFields {
  verseRef: string
  partialVerse: string
  completion: string
}
export interface OpenVerseFields {
  book: string
  chapter: number
  verse: number
  verseText: string
}
export interface TrueFalseFields {
  statement: string
  isTrue: boolean
  explanation: string
}
export interface HotSeatFields {
  challenge: string
  acceptableAnswers: string[]
}

// ─── Question ─────────────────────────────────────────────────────────────────
export interface Question extends SyncBase {
  categoryId: string      // questionType — the format/mechanics (quote, general, etc.)
  topicTag?: string       // subject matter — free-form (bible, science, nature, etc.)
  difficulty: Difficulty
  question: string
  answer: string
  source: QuestionSource
  tags?: string[]
  quoteFields?: QuoteFields
  openVerseFields?: OpenVerseFields
  trueFalseFields?: TrueFalseFields
  hotSeatFields?: HotSeatFields
  aiGenerated?: boolean
  sourceRef?: string
}

// ─── Domain entities ──────────────────────────────────────────────────────────
export interface Session extends SyncBase {
  name: string
  status: SessionStatus
  activeRoundId: string | null
}

export interface Team extends SyncBase {
  sessionId: string
  name: string
  color: string
  players: string[]
}

export interface Round extends SyncBase {
  sessionId: string
  name: string
  categoryId: string      // questionType used for this round
  topicTag?: string       // optional subject-matter filter ('bible', 'science', etc.)
  difficulty: Difficulty
  status: RoundStatus
  questionLimit?: number
  questionQueue: string[]
  questionIndex: number
  currentTeamTurnId: string | null
  turnStartedAt: number | null
  turnExpiresAt: number | null
}

export interface Activity extends SyncBase {
  sessionId: string
  roundId: string
  teamId: string
  questionId: string
  points: number
  reason: ActivityReason
}

// ─── Normalized store ─────────────────────────────────────────────────────────
export interface NormalizedStore {
  sessions:        Record<string, Session>
  teams:           Record<string, Team>
  rounds:          Record<string, Round>
  activities:      Record<string, Activity>
  customQuestions: Record<string, Question>
  categorySettings: Record<string, CategorySettings>  // keyed by categoryId
  /**
   * User-created topic tags persisted locally.
   * Predefined tags (bible, science, etc.) are never stored here — they come from PREDEFINED_TOPICS.
   * Keys are the tag string itself (lowercased, trimmed).
   */
  customTopics:    Record<string, CustomTopic>
}

export interface CustomTopic {
  tag: string        // e.g. 'mythology'
  label: string      // e.g. 'Mythology'
  emoji: string      // e.g. '🏛️'
  createdAt: number
}

// ─── Static config (not persisted) ───────────────────────────────────────────
export interface Category {
  id: string
  name: string
  icon: string
  scoringModeId: string
  turnMode: TurnMode
  description: string
  addHint: string
  rules: string[]          // bullet-point rules shown in settings panel
}

export interface ScoringMode {
  id: string
  name: string
  // These are DEFAULTS only — CategorySettings in store overrides at runtime
  pointsCorrect: number
  pointsWrong: number
  allowPass: boolean
  allowSteal: boolean
  stealPoints: number
}

export interface TeamScore {
  team: Team
  score: number
  rank: number
}

export interface PdfUploadJob {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'done' | 'error'
  createdAt: number
  questionCount?: number
  error?: string
}
