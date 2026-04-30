'use client'

import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES, SCORING_MODES } from '@/lib/data'
import { Scoreboard } from '@/components/game/Scoreboard'
import { ActivityFeed } from '@/components/game/ActivityFeed'
import { ActionButtons } from '@/components/game/ActionButtons'
import { QuestionPanel } from '@/components/game/QuestionPanel'
import { showToast } from '@/components/shared/Toast'
import type { TimerPhase } from '@/types'

export default function GamePage({
  params,
}: {
  params: Promise<{ sessionId: string; roundId: string }>
}) {
  const { sessionId, roundId } = use(params)
  const router = useRouter()

  const round = useGameStore((s) => s.rounds[roundId])
  const teams = useGameStore((s) => s.getSessionTeams(sessionId))
  const answerRevealed = useGameStore((s) => s.answerRevealed)
  const questionDone = useGameStore((s) => s.questionDone)
  const {
    processAnswer, nextQuestion, revealAnswer, endRound,
    getCurrentQuestion, getCategory, getCategorySettings,
  } = useGameStore()

  const question = getCurrentQuestion(roundId)
  const cat = getCategory(round?.categoryId ?? '')
  const cs = getCategorySettings(round?.categoryId ?? '')
  const sm = SCORING_MODES[CATEGORIES.find(c => c.id === round?.categoryId)?.scoringModeId ?? '']

  const currentTeam = teams.find((t) => t.id === round?.currentTeamTurnId)
  const isHotSeat = cat?.turnMode === 'continuous'

  // ── Timer state ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<TimerPhase>('answering')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseRef = useRef<TimerPhase>('answering')

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startCountdown = useCallback((seconds: number, nextPhase: () => void) => {
    stopTimer()
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!); timerRef.current = null
          nextPhase()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopTimer])

  // Enter steal-window phase after answer timer expires
  const enterStealWindow = useCallback(() => {
    if (questionDone) return
    phaseRef.current = 'steal-window'
    setPhase('steal-window')
    revealAnswer()
    showToast('⏱ Time up! Opponents may steal.', 'pass')
    if (sm?.allowSteal && cs?.stealTimeSecs > 0) {
      startCountdown(cs.stealTimeSecs, () => {
        phaseRef.current = 'done'
        setPhase('done')
        useGameStore.setState({ questionDone: true })
        showToast('Steal window closed — no steal', 'info')
      })
    } else {
      phaseRef.current = 'done'
      setPhase('done')
      useGameStore.setState({ questionDone: true })
    }
  }, [cs, sm, revealAnswer, startCountdown, questionDone])

  // Start/reset timer when question changes
  useEffect(() => {
    if (!round || round.status !== 'active') return
    phaseRef.current = 'answering'
    setPhase('answering')

    if (isHotSeat) {
      // Hot seat: countdown from session expiry
      const remaining = Math.max(0, Math.round(((round.turnExpiresAt ?? 0) - Date.now()) / 1000))
      startCountdown(remaining, () => {
        phaseRef.current = 'done'
        setPhase('done')
        showToast("⏱ HOT SEAT TIME'S UP!", 'wrong')
        endRound(roundId)
      })
    } else {
      startCountdown(cs.answerTimeSecs, enterStealWindow)
    }

    return stopTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.questionIndex, round?.id])

  // When question is externally marked done (answer btn clicked), stop timer
  useEffect(() => {
    if (questionDone) stopTimer()
  }, [questionDone, stopTimer])

  // ── Answer handlers ────────────────────────────────────────────────────────
  const handleAnswer = (result: 'correct' | 'wrong' | 'pass') => {
    if (!cs || !sm) return
    stopTimer()
    phaseRef.current = 'done'
    setPhase('done')
    const msgs = {
      correct: `✓ CORRECT! +${cs.pointsCorrect} pts`,
      wrong: `✗ WRONG! ${cs.pointsWrong !== 0 ? cs.pointsWrong + ' pts' : 'no deduction'}`,
      pass: '→ PASSED',
    }
    processAnswer(roundId, result)
    showToast(msgs[result], result === 'correct' ? 'correct' : result === 'wrong' ? 'wrong' : 'pass')
  }

  const handleSteal = (stealTeamId: string) => {
    if (!cs) return
    stopTimer()
    phaseRef.current = 'done'
    setPhase('done')
    const team = teams.find((t) => t.id === stealTeamId)
    processAnswer(roundId, 'steal', stealTeamId)
    showToast(`⚡ STEAL! ${team?.name} +${cs.stealPoints} pts`, 'steal')
  }

  const handleNext = () => {
    nextQuestion(roundId)
    // Timer resets via the useEffect above when questionIndex changes
  }

  const handleEndRound = () => {
    if (confirm('End this round and return to the session dashboard?')) {
      stopTimer()
      endRound(roundId)
      router.push(`/session/${sessionId}`)
    }
  }

  // ── Derived timer visuals ──────────────────────────────────────────────────
  const maxTime = phase === 'steal-window' ? cs?.stealTimeSecs : isHotSeat ? cs?.hotSeatTimeSecs : cs?.answerTimeSecs
  const timerPct = maxTime ? Math.min(100, (timeLeft / maxTime) * 100) : 0

  const timerColor =
    phase === 'steal-window' ? '#2E86DE'
    : timerPct > 60 ? '#F5C842'
    : timerPct > 30 ? '#E67E22'
    : '#C0392B'

  const diffBadge: Record<string, string> = {
    easy: 'text-[#6DFFAA] border-[#1A8A4A]/50 bg-[#1A8A4A]/15',
    medium: 'text-[#F5C842] border-[#F5C842]/50 bg-[#F5C842]/10',
    hard: 'text-[#FF8A80] border-[#C0392B]/50 bg-[#C0392B]/15',
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!round) {
    return (
      <div className="flex items-center justify-center h-full text-[#9BA8C4]">
        <div className="text-center">
          <p className="text-xl mb-3">Round not found.</p>
          <Link href={`/session/${sessionId}`} className="text-[#F5C842] underline">← Back to session</Link>
        </div>
      </div>
    )
  }
  if (round.status === 'completed') {
    router.replace(`/session/${sessionId}`)
    return null
  }

  const qIdx = round.questionIndex + 1
  const qTotal = round.questionQueue.length
  const otherTeams = teams.filter((t) => t.id !== round.currentTeamTurnId)

  return (
    <div className="flex flex-col h-full">
      {/* Game header */}
      <header
        className="border-b px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.25)', background: 'linear-gradient(135deg,#142240,#1E3360)' }}
      >
        <Link href={`/session/${sessionId}`} className="text-[#9BA8C4] hover:text-[#F5C842] text-base transition-colors">←</Link>
        <div className="font-display text-lg tracking-widest text-gold-glow flex-1 truncate">{round.name}</div>

        {/* Phase badge */}
        {!questionDone && phase === 'steal-window' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide animate-pulse"
            style={{ background: 'rgba(46,134,222,0.2)', border: '1px solid rgba(46,134,222,0.5)', color: '#74B9FF' }}>
            ⚡ STEAL WINDOW
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#9BA8C4] flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6DFFAA] animate-pulse" />
          Q {qIdx}/{qTotal}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-4 items-start">

            {/* ── LEFT: Main gameplay ─────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <QuestionPanel
                question={question}
                cat={cat}
                difficulty={round.difficulty}
                diffBadge={diffBadge}
                qIdx={qIdx}
                qTotal={qTotal}
                answerRevealed={answerRevealed}
                onReveal={revealAnswer}
                isHotSeat={isHotSeat}
                timerPct={timerPct}
                timerColor={timerColor}
                timeLeft={timeLeft}
                phase={phase}
              />

              {/* Current team + timer display */}
              <div className="panel flex items-center gap-4">
                {phase === 'steal-window' && !questionDone ? (
                  // Steal window: show all eligible stealers
                  <div className="flex-1">
                    <div className="text-[10px] text-[#74B9FF] uppercase tracking-widest mb-2 font-semibold">
                      ⚡ Steal opportunity — opponents may answer
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {otherTeams.map((t) => (
                        <span key={t.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: `${t.color}22`, border: `1px solid ${t.color}55`, color: t.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="text-[10px] text-[#9BA8C4] uppercase tracking-widest mb-0.5">Current Turn</div>
                    <div className="font-display text-3xl tracking-wide" style={{ color: currentTeam?.color }}>
                      {currentTeam?.name ?? '—'}
                    </div>
                  </div>
                )}

                {/* Timer clock */}
                {!questionDone && (
                  <div className="text-right flex-shrink-0">
                    <div
                      className="font-display text-5xl tabular-nums leading-none"
                      style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}66` }}
                    >
                      {timeLeft}
                    </div>
                    <div className="text-[10px] text-[#9BA8C4] mt-0.5 uppercase tracking-wide">
                      {phase === 'steal-window' ? 'steal window' : isHotSeat ? 'remaining' : 'to answer'}
                    </div>
                  </div>
                )}
                {questionDone && (
                  <div className="text-[#F5C842] font-display text-lg tracking-wider">DONE ✓</div>
                )}
              </div>

              <ActionButtons
                sm={sm}
                cs={cs}
                questionDone={questionDone}
                phase={phase}
                teams={teams}
                currentTeamId={round.currentTeamTurnId}
                onAnswer={handleAnswer}
                onSteal={handleSteal}
                onNext={handleNext}
                onEndRound={handleEndRound}
                hasNextQuestion={round.questionIndex + 1 < round.questionQueue.length}
              />
            </div>

            {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-4">
              <Scoreboard sessionId={sessionId} roundId={roundId} currentTeamId={round.currentTeamTurnId} />
              <ActivityFeed roundId={roundId} teams={teams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}