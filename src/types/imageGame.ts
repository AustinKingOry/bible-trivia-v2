// ─── Image Game Types ─────────────────────────────────────────────────────────

export interface ImageQuestion {
  id: string
  imageUrl: string        // pasted URL or data URL from upload
  answer: string          // the correct identification
  hint?: string           // optional hint shown after timer
  topicTag?: string       // e.g. 'bible', 'science', 'geography'
  difficulty: 'easy' | 'medium' | 'hard'
  source: 'manual' | 'ai'
  createdAt: number
  updatedAt: number
  synced?: boolean
  deletedAt?: number
}

export type ParticipantType = 'individual' | 'team'

export interface ImageParticipant {
  id: string
  name: string
  type: ParticipantType
  members?: string[]      // team member names (optional)
  color: string
  score: number
}

export type ImageRoundStatus = 'pending' | 'active' | 'completed'

export interface ImageRound {
  id: string
  sessionId: string
  name: string
  topicTag?: string       // subject filter (optional)
  difficulty?: 'easy' | 'medium' | 'hard' | 'all'
  status: ImageRoundStatus
  // Shuffled queue of question IDs
  questionQueue: string[]
  questionIndex: number
  // Per-question: ordered queue of participant IDs waiting to answer
  participantQueue: string[]
  // Timer config (seconds per image)
  answerTimeSecs: number
  pointsCorrect: number
  pointsWrong: number
  createdAt: number
  updatedAt: number
}

export interface ImageActivity {
  id: string
  sessionId: string
  roundId: string
  questionId: string
  participantId: string
  result: 'correct' | 'wrong' | 'skip'
  points: number
  createdAt: number
}

export interface ImageSession {
  id: string
  name: string
  participantMode: ParticipantType  // 'individual' | 'team'
  participants: ImageParticipant[]
  rounds: ImageRound[]
  activities: ImageActivity[]
  status: 'setup' | 'active' | 'ended'
  createdAt: number
  updatedAt: number
}
