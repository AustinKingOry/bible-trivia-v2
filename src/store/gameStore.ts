import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  NormalizedStore, Session, Team, Round, Activity, Question,
  Difficulty, AnswerResult, SessionStatus, RoundStatus, CategorySettings,
} from '@/types'
import { CATEGORIES, SCORING_MODES, TEAM_COLORS, SEED_QUESTIONS, DEFAULT_CATEGORY_SETTINGS } from '@/lib/data'
import { uid, now, deriveLeaderboard, getNextTeamId, markDirty } from '@/lib/engine'

interface GameStore extends NormalizedStore {
  activeSessionId: string | null
  answerRevealed: boolean
  questionDone: boolean

  // ── Category settings ─────────────────────────────────────────────────────
  updateCategorySettings: (categoryId: string, patch: Partial<CategorySettings>) => void
  resetCategorySettings: (categoryId: string) => void
  getCategorySettings: (categoryId: string) => CategorySettings

  // ── Session ───────────────────────────────────────────────────────────────
  createSession: (name: string) => string
  setSessionStatus: (sessionId: string, status: SessionStatus) => void
  setActiveSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void

  // ── Teams ─────────────────────────────────────────────────────────────────
  addTeam: (sessionId: string, name: string) => void
  removeTeam: (teamId: string) => void
  updateTeamName: (teamId: string, name: string) => void
  addPlayer: (teamId: string, player: string) => void
  removePlayer: (teamId: string, player: string) => void

  // ── Rounds ────────────────────────────────────────────────────────────────
  createRound: (sessionId: string, opts: { name: string; categoryId: string; difficulty: Difficulty; questionLimit?: number }) => string
  startRound: (roundId: string) => void
  endRound: (roundId: string) => void
  deleteRound: (roundId: string) => void

  // ── Gameplay ──────────────────────────────────────────────────────────────
  processAnswer: (roundId: string, result: AnswerResult, stealTeamId?: string) => void
  nextQuestion: (roundId: string) => void
  revealAnswer: () => void
  resetQuestionState: () => void
  markQuestionDone: () => void

  // ── Questions ─────────────────────────────────────────────────────────────
  addQuestion: (q: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => string
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  getAllQuestions: () => Question[]
  getQuestionsByCategory: (categoryId: string) => Question[]

  // ── Sync ──────────────────────────────────────────────────────────────────
  markSynced: (ids: { questions?: string[]; sessions?: string[]; teams?: string[]; rounds?: string[]; activities?: string[] }) => void
  mergePulledQuestions: (questions: Question[]) => void

  // ── Selectors ─────────────────────────────────────────────────────────────
  getSessionTeams: (sessionId: string) => Team[]
  getSessionRounds: (sessionId: string) => Round[]
  getActiveRound: (sessionId: string) => Round | null
  getLeaderboard: (sessionId: string, roundId?: string) => ReturnType<typeof deriveLeaderboard>
  getCurrentQuestion: (roundId: string) => Question | undefined
  getCategory: (categoryId: string) => typeof CATEGORIES[0] | undefined
  getRoundActivities: (roundId: string) => Activity[]
  getAvailableQuestionCount: (categoryId: string, difficulty: string) => number
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      teams: {},
      rounds: {},
      activities: {},
      customQuestions: {},
      categorySettings: { ...DEFAULT_CATEGORY_SETTINGS },
      activeSessionId: null,
      answerRevealed: false,
      questionDone: false,

      // ── Category settings ─────────────────────────────────────────────────
      getCategorySettings: (categoryId) => {
        const stored = get().categorySettings[categoryId]
        return stored ?? DEFAULT_CATEGORY_SETTINGS[categoryId] ?? DEFAULT_CATEGORY_SETTINGS['general']
      },

      updateCategorySettings: (categoryId, patch) =>
        set((s) => ({
          categorySettings: {
            ...s.categorySettings,
            [categoryId]: { ...s.categorySettings[categoryId] ?? DEFAULT_CATEGORY_SETTINGS[categoryId], ...patch },
          },
        })),

      resetCategorySettings: (categoryId) =>
        set((s) => ({
          categorySettings: {
            ...s.categorySettings,
            [categoryId]: { ...DEFAULT_CATEGORY_SETTINGS[categoryId] },
          },
        })),

      // ── Session ──────────────────────────────────────────────────────────
      createSession: (name) => {
        const id = uid('session')
        const session: Session = { id, name, status: 'setup', activeRoundId: null, createdAt: now(), updatedAt: now(), synced: false }
        set((s) => ({ sessions: { ...s.sessions, [id]: session }, activeSessionId: id }))
        return id
      },
      setSessionStatus: (sessionId, status) =>
        set((s) => ({ sessions: { ...s.sessions, [sessionId]: markDirty({ ...s.sessions[sessionId], status }) } })),
      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      deleteSession: (sessionId) =>
        set((s) => {
          const sessions = { ...s.sessions }; delete sessions[sessionId]
          const teams = Object.fromEntries(Object.entries(s.teams).filter(([,t]) => t.sessionId !== sessionId))
          const rounds = Object.fromEntries(Object.entries(s.rounds).filter(([,r]) => r.sessionId !== sessionId))
          const activities = Object.fromEntries(Object.entries(s.activities).filter(([,a]) => a.sessionId !== sessionId))
          return { sessions, teams, rounds, activities, activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId }
        }),

      // ── Teams ────────────────────────────────────────────────────────────
      addTeam: (sessionId, name) => {
        const existing = Object.values(get().teams).filter((t) => t.sessionId === sessionId)
        if (existing.find((t) => t.name.toLowerCase() === name.toLowerCase())) return
        const id = uid('team')
        const team: Team = { id, sessionId, name, color: TEAM_COLORS[existing.length % TEAM_COLORS.length], players: [], createdAt: now(), updatedAt: now(), synced: false }
        set((s) => ({ teams: { ...s.teams, [id]: team } }))
      },
      removeTeam: (teamId) => set((s) => { const t = { ...s.teams }; delete t[teamId]; return { teams: t } }),
      updateTeamName: (teamId, name) =>
        set((s) => ({ teams: { ...s.teams, [teamId]: markDirty({ ...s.teams[teamId], name }) } })),
      addPlayer: (teamId, player) =>
        set((s) => {
          const team = s.teams[teamId]; if (!team || team.players.includes(player)) return s
          return { teams: { ...s.teams, [teamId]: markDirty({ ...team, players: [...team.players, player] }) } }
        }),
      removePlayer: (teamId, player) =>
        set((s) => {
          const team = s.teams[teamId]; if (!team) return s
          return { teams: { ...s.teams, [teamId]: markDirty({ ...team, players: team.players.filter((p) => p !== player) }) } }
        }),

      // ── Rounds ───────────────────────────────────────────────────────────
      createRound: (sessionId, opts) => {
        const id = uid('round')
        const sessionTeams = get().getSessionTeams(sessionId)
        const round: Round = {
          id, sessionId, name: opts.name, categoryId: opts.categoryId,
          difficulty: opts.difficulty, questionLimit: opts.questionLimit,
          status: 'pending', questionQueue: [], questionIndex: 0,
          currentTeamTurnId: sessionTeams[0]?.id ?? null,
          turnStartedAt: null, turnExpiresAt: null,
          createdAt: now(), updatedAt: now(), synced: false,
        }
        set((s) => ({ rounds: { ...s.rounds, [id]: round } }))
        return id
      },
      startRound: (roundId) => {
        const { rounds, sessions, getSessionTeams, getAllQuestions, getCategorySettings } = get()
        const round = rounds[roundId]; if (!round) return
        const _teams = get().getSessionTeams(round.sessionId)
        if (_teams.length === 0) { console.warn('startRound: no teams in session'); return }
        const allQs = getAllQuestions()
        const pool = allQs.filter((q) =>
          q.categoryId === round.categoryId &&
          (round.difficulty === 'all' || q.difficulty === round.difficulty)
        )
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        const limited = round.questionLimit ? shuffled.slice(0, round.questionLimit) : shuffled
        const queue = limited.map((q) => q.id)
        const teams = getSessionTeams(round.sessionId)
        const cs = getCategorySettings(round.categoryId)
        const cat = CATEGORIES.find((c) => c.id === round.categoryId)
        // Hot seat: turnExpiresAt = session end time; others: per-question (set when question starts)
        const isHotSeat = cat?.turnMode === 'continuous'
        const turnExpiry = isHotSeat ? now() + cs.hotSeatTimeSecs * 1000 : now() + cs.answerTimeSecs * 1000
        const updated: Round = markDirty({
          ...round, status: 'active' as RoundStatus, questionQueue: queue, questionIndex: 0,
          currentTeamTurnId: teams[0]?.id ?? null,
          turnStartedAt: now(), turnExpiresAt: turnExpiry,
        })
        const session = sessions[round.sessionId]
        const updatedSession = session ? markDirty({ ...session, status: 'active' as const, activeRoundId: roundId }) : session
        set((s) => ({
          rounds: { ...s.rounds, [roundId]: updated },
          sessions: updatedSession ? { ...s.sessions, [round.sessionId]: updatedSession } : s.sessions,
          answerRevealed: false, questionDone: false,
        }))
      },
      endRound: (roundId) => {
        const { rounds, sessions } = get()
        const round = rounds[roundId]; if (!round) return
        const updated = markDirty({ ...round, status: 'completed' as RoundStatus })
        const session = sessions[round.sessionId]
        const updatedSession = session ? markDirty({ ...session, activeRoundId: null }) : session
        set((s) => ({
          rounds: { ...s.rounds, [roundId]: updated },
          sessions: updatedSession ? { ...s.sessions, [round.sessionId]: updatedSession } : s.sessions,
        }))
      },
      deleteRound: (roundId) =>
        set((s) => {
          const rounds = { ...s.rounds }; delete rounds[roundId]
          const activities = Object.fromEntries(Object.entries(s.activities).filter(([,a]) => a.roundId !== roundId))
          return { rounds, activities }
        }),

      // ── Gameplay ─────────────────────────────────────────────────────────
      processAnswer: (roundId, result, stealTeamId) => {
        const { rounds, activities, getSessionTeams, getCategorySettings, getCategory } = get()
        const round = rounds[roundId]; if (!round || round.status !== 'active') return
        const cs = getCategorySettings(round.categoryId)
        const cat = getCategory(round.categoryId)
        const sm = SCORING_MODES[CATEGORIES.find(c=>c.id===round.categoryId)?.scoringModeId ?? '']
        if (!cs || !cat || !round.currentTeamTurnId) return
        const teams = getSessionTeams(round.sessionId)
        const currentQ = round.questionQueue[round.questionIndex]; if (!currentQ) return

        const makeActivity = (teamId: string, points: number, reason: Activity['reason']): Activity => ({
          id: uid('act'), sessionId: round.sessionId, roundId, teamId, questionId: currentQ,
          points, reason, createdAt: now(), updatedAt: now(), synced: false,
        })

        let newActivities = { ...activities }
        let nextTeamId = round.currentTeamTurnId
        // lockQuestion=false for wrong/pass so the game page can open the steal window first
        let lockQuestion = true

        if (result === 'correct') {
          const a = makeActivity(round.currentTeamTurnId, cs.pointsCorrect, 'correct')
          newActivities[a.id] = a
          // Turn advances in nextQuestion — do not advance here
        } else if (result === 'wrong') {
          if (cs.pointsWrong !== 0) { const a = makeActivity(round.currentTeamTurnId, cs.pointsWrong, 'wrong'); newActivities[a.id] = a }
          // Turn advances in nextQuestion — do not advance here
          lockQuestion = false
        } else if (result === 'pass') {
          // Turn advances in nextQuestion — do not advance here
          lockQuestion = false
        } else if (result === 'steal' && stealTeamId) {
          const a = makeActivity(stealTeamId, cs.stealPoints, 'steal'); newActivities[a.id] = a
          // Turn advances in nextQuestion — do not advance here
        }

        set({
          activities: newActivities,
          rounds: { ...rounds, [roundId]: markDirty({ ...round }) },
          ...(lockQuestion ? { questionDone: true, answerRevealed: true } : {}),
        })
      },

      nextQuestion: (roundId) => {
        const { rounds, getCategorySettings } = get()
        const round = rounds[roundId]; if (!round) return
        const teams = get().getSessionTeams(round.sessionId)
        if (teams.length === 0) { console.warn('nextQuestion: no teams in session'); return }
        const nextIdx = round.questionIndex + 1
        if (nextIdx >= round.questionQueue.length) { get().endRound(roundId); return }
        const cat = CATEGORIES.find((c) => c.id === round.categoryId)
        const cs = getCategorySettings(round.categoryId)
        const isHotSeat = cat?.turnMode === 'continuous'
        const turnExpiry = isHotSeat ? round.turnExpiresAt : now() + cs.answerTimeSecs * 1000
        // Always advance turn to next team when moving to next question
        const nextTeamId = cat?.turnMode === 'per-question-rotation' && round.currentTeamTurnId
          ? getNextTeamId(teams, round.currentTeamTurnId)
          : round.currentTeamTurnId
        set((s) => ({
          rounds: { ...s.rounds, [roundId]: markDirty({
            ...round,
            questionIndex: nextIdx,
            currentTeamTurnId: nextTeamId,
            turnStartedAt: now(),
            turnExpiresAt: turnExpiry,
          }) },
          answerRevealed: false, questionDone: false,
        }))
      },

      revealAnswer: () => set({ answerRevealed: true }),
      resetQuestionState: () => set({ answerRevealed: false, questionDone: false }),
      markQuestionDone: () => set({ questionDone: true }),

      // ── Questions ────────────────────────────────────────────────────────
      addQuestion: (q) => {
        const id = uid('q')
        const question: Question = { ...q, id, createdAt: now(), updatedAt: now(), synced: false }
        set((s) => ({ customQuestions: { ...s.customQuestions, [id]: question } }))
        return id
      },
      updateQuestion: (id, updates) =>
        set((s) => {
          const q = s.customQuestions[id]; if (!q) return s
          return { customQuestions: { ...s.customQuestions, [id]: markDirty({ ...q, ...updates }) } }
        }),
      deleteQuestion: (id) =>
        set((s) => { const cq = { ...s.customQuestions }; delete cq[id]; return { customQuestions: cq } }),
      getAllQuestions: () => [...SEED_QUESTIONS, ...Object.values(get().customQuestions)],
      getQuestionsByCategory: (categoryId) => get().getAllQuestions().filter((q) => q.categoryId === categoryId),

      // ── Sync ─────────────────────────────────────────────────────────────
      markSynced: ({ questions = [], sessions = [], teams = [], rounds = [], activities = [] }) =>
        set((s) => {
          const patch = <T extends { synced?: boolean }>(
            record: Record<string, T>, ids: string[]
          ): Record<string, T> => {
            if (!ids.length) return record
            const next = { ...record }
            ids.forEach((id) => { if (next[id]) next[id] = { ...next[id], synced: true } })
            return next
          }
          return {
            customQuestions: patch(s.customQuestions, questions),
            sessions:        patch(s.sessions,        sessions),
            teams:           patch(s.teams,            teams),
            rounds:          patch(s.rounds,           rounds),
            activities:      patch(s.activities,       activities),
          }
        }),

      mergePulledQuestions: (pulled) =>
        set((s) => {
          const next = { ...s.customQuestions }
          pulled.forEach((q) => {
            // Only import non-seed questions; don't overwrite newer local edits
            if (q.source === 'seed') return
            const existing = next[q.id]
            if (!existing || q.updatedAt > existing.updatedAt) {
              next[q.id] = { ...q, synced: true }
            }
          })
          return { customQuestions: next }
        }),

      // ── Selectors ────────────────────────────────────────────────────────
      getSessionTeams: (sessionId) =>
        Object.values(get().teams).filter((t) => t.sessionId === sessionId).sort((a,b) => a.createdAt - b.createdAt),
      getSessionRounds: (sessionId) =>
        Object.values(get().rounds).filter((r) => r.sessionId === sessionId).sort((a,b) => a.createdAt - b.createdAt),
      getActiveRound: (sessionId) => {
        const { sessions, rounds } = get()
        const session = sessions[sessionId]; if (!session?.activeRoundId) return null
        return rounds[session.activeRoundId] ?? null
      },
      getLeaderboard: (sessionId, roundId) => {
        const { teams, activities } = get()
        const sessionTeams = Object.values(teams).filter((t) => t.sessionId === sessionId)
        const filtered = Object.values(activities).filter((a) => a.sessionId === sessionId && (!roundId || a.roundId === roundId))
        return deriveLeaderboard(sessionTeams, filtered, sessionId, roundId)
      },
      getCurrentQuestion: (roundId) => {
        const round = get().rounds[roundId]; if (!round) return undefined
        const qId = round.questionQueue[round.questionIndex]
        return get().getAllQuestions().find((q) => q.id === qId)
      },
      getCategory: (categoryId) => CATEGORIES.find((c) => c.id === categoryId),
      getRoundActivities: (roundId) =>
        Object.values(get().activities).filter((a) => a.roundId === roundId).sort((a,b) => b.createdAt - a.createdAt),
      getAvailableQuestionCount: (categoryId, difficulty) =>
        get().getAllQuestions().filter((q) =>
          q.categoryId === categoryId && (difficulty === 'all' || q.difficulty === difficulty)
        ).length,
    }),
    {
      name: 'btgms-v3',
      partialize: (s) => ({
        sessions: s.sessions, teams: s.teams, rounds: s.rounds,
        activities: s.activities, customQuestions: s.customQuestions,
        categorySettings: s.categorySettings, activeSessionId: s.activeSessionId,
      }),
    }
  )
)
