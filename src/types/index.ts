// ─── Sync-ready base ─────────────────────────────────────────────────────────
export interface SyncBase {
  id: string
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
  categoryId: string

  // Scoring
  pointsCorrect: number
  pointsWrong: number      // negative = deduction, 0 = no penalty
  stealPoints: number

  // Timers — non-hotseat
  answerTimeSecs: number   // how long the active team has to answer
  stealTimeSecs: number    // how long opponents have to steal after time expires

  // Hot Seat only
  hotSeatTimeSecs: number  // total session duration for the hot-seat round
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
  categoryId: string
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
  categoryId: string
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