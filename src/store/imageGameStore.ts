import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ImageQuestion, ImageSession, ImageRound, ImageParticipant,
  ImageActivity, ImageRoundStatus,
} from '@/types/imageGame'
import { PREDEFINED_TOPICS } from '@/lib/data'

const PARTICIPANT_COLORS = [
  '#E74C3C','#3498DB','#2ECC71','#9B59B6',
  '#F39C12','#1ABC9C','#E67E22','#E91E63',
  '#00CEC9','#FDCB6E','#6C5CE7','#A29BFE',
]

function uid(prefix = 'ig') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
function now() { return Date.now() }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface ImageGameStore {
  sessions:  Record<string, ImageSession>
  questions: Record<string, ImageQuestion>

  // ── Sessions ───────────────────────────────────────────────────────────────
  createSession: (name: string, participantMode: 'individual' | 'team') => string
  deleteSession: (id: string) => void
  endSession: (id: string) => void

  // ── Participants ───────────────────────────────────────────────────────────
  addParticipant: (sessionId: string, name: string, members?: string[]) => void
  removeParticipant: (sessionId: string, participantId: string) => void
  updateParticipant: (sessionId: string, participantId: string, patch: Partial<Pick<ImageParticipant, 'name' | 'members'>>) => void
  reorderParticipants: (sessionId: string, fromIndex: number, toIndex: number) => void

  // ── Questions ──────────────────────────────────────────────────────────────
  addQuestion: (q: Omit<ImageQuestion, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => string
  updateQuestion: (id: string, patch: Partial<ImageQuestion>) => void
  deleteQuestion: (id: string) => void
  getFilteredQuestions: (topicTag?: string, difficulty?: string) => ImageQuestion[]

  // ── Rounds ─────────────────────────────────────────────────────────────────
  createRound: (sessionId: string, opts: {
    name: string
    topicTag?: string
    difficulty?: string
    answerTimeSecs?: number
    pointsCorrect?: number
    pointsWrong?: number
  }) => string
  startRound: (sessionId: string, roundId: string) => void
  endRound: (sessionId: string, roundId: string) => void
  deleteRound: (sessionId: string, roundId: string) => void

  // ── Gameplay ───────────────────────────────────────────────────────────────
  recordAnswer: (sessionId: string, roundId: string, result: 'correct' | 'wrong' | 'skip') => void
  nextQuestion: (sessionId: string, roundId: string) => void
  rotateParticipantQueue: (sessionId: string, roundId: string) => void

  // ── Selectors ─────────────────────────────────────────────────────────────
  getSession: (id: string) => ImageSession | undefined
  getActiveRound: (sessionId: string) => ImageRound | undefined
  getCurrentQuestion: (sessionId: string, roundId: string) => ImageQuestion | undefined
  getLeaderboard: (sessionId: string) => ImageParticipant[]
  getAvailableCount: (topicTag?: string, difficulty?: string) => number

  //── Sync ──────────────────────────────────────────────────────────────────
  markImageSynced: (ids: { questions?: string[]; sessions?: string[] }) => void
  mergePulledImageQuestions: (questions: ImageQuestion[]) => void
  getDirtyPayload: () => { dirtyQuestions: ImageQuestion[]; dirtySessions: ImageSession[]
  dirtyRounds: ImageRound[]; dirtyActivities: ImageActivity[] }
}

export const useImageGameStore = create<ImageGameStore>()(
  persist(
    (set, get) => ({
      sessions:  {},
      questions: {},

      // ── Sessions ───────────────────────────────────────────────────────────
      createSession: (name, participantMode) => {
        const id = uid('igs')
        const session: ImageSession = {
          id, name, participantMode,
          participants: [], rounds: [], activities: [],
          status: 'setup', createdAt: now(), updatedAt: now(), synced: false}
        set((s) => ({ sessions: { ...s.sessions, [id]: session } }))
        return id
      },

      deleteSession: (id) =>
        set((s) => { const sessions = { ...s.sessions }; delete sessions[id]; return { sessions } }),

      endSession: (id) =>
        set((s) => ({
          sessions: { ...s.sessions, [id]: { ...s.sessions[id], status: 'ended', updatedAt: now(), synced: false } },
        })),

      // ── Participants ───────────────────────────────────────────────────────
      addParticipant: (sessionId, name, members) => {
        const session = get().sessions[sessionId]; if (!session) return
        const colorIdx = session.participants.length % PARTICIPANT_COLORS.length
        const p: ImageParticipant = {
          id: uid('igp'), name, type: session.participantMode,
          members: members ?? [], color: PARTICIPANT_COLORS[colorIdx], score: 0,
        }
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: { ...session, participants: [...session.participants, p], updatedAt: now(), synced: false },
          },
        }))
      },

      removeParticipant: (sessionId, participantId) => {
        const session = get().sessions[sessionId]; if (!session) return
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              participants: session.participants.filter((p) => p.id !== participantId),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      updateParticipant: (sessionId, participantId, patch) => {
        const session = get().sessions[sessionId]; if (!session) return
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              participants: session.participants.map((p) =>
                p.id === participantId ? { ...p, ...patch } : p
              ),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      reorderParticipants: (sessionId, from, to) => {
        const session = get().sessions[sessionId]; if (!session) return
        const arr = [...session.participants]
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        set((s) => ({
          sessions: { ...s.sessions, [sessionId]: { ...session, participants: arr, updatedAt: now(), synced: false } },
        }))
      },

      // ── Questions ──────────────────────────────────────────────────────────
      addQuestion: (q) => {
        const id = uid('igq')
        const question: ImageQuestion = { ...q, id, createdAt: now(), updatedAt: now(), synced: false }
        set((s) => ({ questions: { ...s.questions, [id]: question } }))
        return id
      },

      updateQuestion: (id, patch) =>
        set((s) => ({
          questions: { ...s.questions, [id]: { ...s.questions[id], ...patch, updatedAt: now(), synced: false }
        },
      })),

      deleteQuestion: (id) =>
        set((s) => ({
          questions: { ...s.questions, [id]: { ...s.questions[id], deletedAt: now(), updatedAt: now(), synced: false } },
      })),

      getFilteredQuestions: (topicTag, difficulty) =>
        Object.values(get().questions).filter((q) => {
          if (q.deletedAt) return false
          if (topicTag && topicTag !== '__all__' && q.topicTag !== topicTag) return false
          if (difficulty && difficulty !== 'all' && q.difficulty !== difficulty) return false
          return true
        }),

      // ── Rounds ────────────────────────────────────────────────────────────
      createRound: (sessionId, opts) => {
        const session = get().sessions[sessionId]; if (!session) return ''
        const id = uid('igr')
        const round: ImageRound = {
          id, sessionId,
          name: opts.name,
          topicTag: opts.topicTag,
          difficulty: (opts.difficulty ?? 'all') as ImageRound['difficulty'],
          status: 'pending',
          questionQueue: [],
          questionIndex: 0,
          participantQueue: session.participants.map((p) => p.id),
          answerTimeSecs: opts.answerTimeSecs ?? 30,
          pointsCorrect: opts.pointsCorrect ?? 10,
          pointsWrong: opts.pointsWrong ?? 0,
          createdAt: now(), updatedAt: now(),
          synced: false,
        }
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: { ...session, rounds: [...session.rounds, round], updatedAt: now(), synced: false },
          },
        }))
        return id
      },

      startRound: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return
        const { getFilteredQuestions } = get()
        const round = session.rounds.find((r) => r.id === roundId); if (!round) return
        const filtered = getFilteredQuestions(round.topicTag, round.difficulty)
        const queue = shuffle(filtered).map((q) => q.id)
        if (!queue.length) return
        const participantQueue = session.participants.map((p) => p.id)
        const updated: ImageRound = {
          ...round, status: 'active', questionQueue: queue, questionIndex: 0,
          participantQueue, updatedAt: now(), synced: false,
        }
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              status: 'active',
              rounds: session.rounds.map((r) => r.id === roundId ? updated : r),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      endRound: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              rounds: session.rounds.map((r) =>
                r.id === roundId ? { ...r, status: 'completed' as ImageRoundStatus, updatedAt: now(), synced: false } : r
              ),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      deleteRound: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              rounds: session.rounds.filter((r) => r.id !== roundId),
              activities: session.activities.filter((a) => a.roundId !== roundId),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      // ── Gameplay ──────────────────────────────────────────────────────────
      recordAnswer: (sessionId, roundId, result) => {
        const session = get().sessions[sessionId]; if (!session) return
        const round = session.rounds.find((r) => r.id === roundId); if (!round) return
        const currentParticipantId = round.participantQueue[0]; if (!currentParticipantId) return
        const questionId = round.questionQueue[round.questionIndex]; if (!questionId) return

        const points = result === 'correct' ? round.pointsCorrect : result === 'wrong' ? -round.pointsWrong : 0
        const activity: ImageActivity = {
          id: uid('iga'), sessionId, roundId, questionId,
          participantId: currentParticipantId, result, points, createdAt: now(), synced: false,
        }

        // Update participant score
        const updatedParticipants = session.participants.map((p) =>
          p.id === currentParticipantId ? { ...p, score: p.score + points } : p
        )

        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              participants: updatedParticipants,
              activities: [...session.activities, activity],
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      nextQuestion: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return
        const round = session.rounds.find((r) => r.id === roundId); if (!round) return
        const nextIdx = round.questionIndex + 1
        if (nextIdx >= round.questionQueue.length) {
          get().endRound(sessionId, roundId)
          return
        }
        // Rotate participant queue for next question
        const rotated = [...round.participantQueue.slice(1), round.participantQueue[0]]
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              rounds: session.rounds.map((r) =>
                r.id === roundId
                  ? { ...r, questionIndex: nextIdx, participantQueue: rotated, updatedAt: now(), synced: false }
                  : r
              ),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      rotateParticipantQueue: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return
        const round = session.rounds.find((r) => r.id === roundId); if (!round) return
        const rotated = [...round.participantQueue.slice(1), round.participantQueue[0]]
        set((s) => ({
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              rounds: session.rounds.map((r) =>
                r.id === roundId ? { ...r, participantQueue: rotated, updatedAt: now(), synced: false } : r
              ),
              updatedAt: now(),
              synced: false,
            },
          },
        }))
      },

      // ── Selectors ─────────────────────────────────────────────────────────
      getSession: (id) => get().sessions[id],

      getActiveRound: (sessionId) =>
        get().sessions[sessionId]?.rounds.find((r) => r.status === 'active'),

      getCurrentQuestion: (sessionId, roundId) => {
        const session = get().sessions[sessionId]; if (!session) return undefined
        const round = session.rounds.find((r) => r.id === roundId); if (!round) return undefined
        const qId = round.questionQueue[round.questionIndex]
        return get().questions[qId]
      },

      getLeaderboard: (sessionId) => {
        const session = get().sessions[sessionId]; if (!session) return []
        return [...session.participants].sort((a, b) => b.score - a.score)
      },

      getAvailableCount: (topicTag, difficulty) =>
        get().getFilteredQuestions(topicTag, difficulty).length,

      // ── Sync ──────────────────────────────────────────────────────────────
      markImageSynced: ({ questions = [], sessions = [] }) =>
        set((s) => {
          const nextQ = { ...s.questions }
          questions.forEach((id) => { if (nextQ[id]) nextQ[id] = { ...nextQ[id], synced: true } })
          const nextS = { ...s.sessions }
          sessions.forEach((id) => { if (nextS[id]) nextS[id] = { ...nextS[id], synced: true } })
          return { questions: nextQ, sessions: nextS }
        }),

      mergePulledImageQuestions: (pulled) =>
        set((s) => {
          const next = { ...s.questions }
          pulled.forEach((q) => {
            const existing = next[q.id]
            if (!existing || q.updatedAt > (existing.updatedAt ?? 0)) {
              next[q.id] = { ...q, synced: true }
            }
          })
          return { questions: next }
        }),

      getDirtyPayload: () => {
        const { sessions, questions } = get()
        const dirtySessions   = Object.values(sessions).filter((s) => (s as any).synced === false)
        const dirtyQuestions  = Object.values(questions).filter((q) => q.synced === false)
        // Collect rounds and activities from dirty sessions
        const dirtyRounds     = dirtySessions.flatMap((s) => s.rounds)
        const dirtyActivities = dirtySessions.flatMap((s) => s.activities)
        return { dirtyQuestions, dirtySessions, dirtyRounds, dirtyActivities }
      },
    }),
    {
      name: 'btgms-image-game-v1',
      partialize: (s) => ({ sessions: s.sessions, questions: s.questions }),
    }
  )
)
