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
import type { QuestionPhase } from '@/types'

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
    resetQuestionState, markQuestionDone,
  } = useGameStore()

  const question = getCurrentQuestion(roundId)
  const cat = getCategory(round?.categoryId ?? '')
  const cs = getCategorySettings(round?.categoryId ?? '')
  const sm = SCORING_MODES[CATEGORIES.find(c => c.id === round?.categoryId)?.scoringModeId ?? '']

  const currentTeam = teams.find((t) => t.id === round?.currentTeamTurnId)
  const isHotSeat = cat?.turnMode === 'continuous'

  // ── Phase + timer state ────────────────────────────────────────────────────
  const [phase, setPhase] = useState<QuestionPhase>('team1-answering')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  // Which team is currently in the steal seat (set when admin picks a team)
  const [stealingTeamId, setStealingTeamId] = useState<string | null>(null)
  // Lock in the original answering team at question start — never changes mid-question
  const answeringTeamIdRef = useRef<string | null>(round?.currentTeamTurnId ?? null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startCountdown = useCallback((seconds: number, onExpire: () => void) => {
    stopTimer()
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!); timerRef.current = null
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopTimer])

  // ── Reset on new question ──────────────────────────────────────────────────
  useEffect(() => {
    if (!round || round.status !== 'active') return
    setStealingTeamId(null)
    // Capture the answering team at question start — used for steal offer UI
    answeringTeamIdRef.current = round.currentTeamTurnId

    if (isHotSeat) {
      setPhase('team1-answering')
      const remaining = Math.max(0, Math.round(((round.turnExpiresAt ?? 0) - Date.now()) / 1000))
      startCountdown(remaining, () => {
        setPhase('done')
        showToast("⏱ HOT SEAT TIME'S UP!", 'wrong')
        endRound(roundId)
      })
    } else {
      setPhase('team1-answering')
      startCountdown(cs.answerTimeSecs, () => {
        // Timer ran out for team1 — treat as a pass, open steal
        setPhase('steal-offered')
        revealAnswer()
        showToast('⏱ Time up — opponents may steal', 'pass')
      })
    }

    return stopTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.questionIndex, round?.id])

  // Stop timer when question is fully done
  useEffect(() => {
    if (questionDone) stopTimer()
  }, [questionDone, stopTimer])

  // ── Action handlers ────────────────────────────────────────────────────────

  /** Team 1 answered correctly */
  const handleCorrect = () => {
    stopTimer()
    setPhase('done')
    processAnswer(roundId, 'correct')
    showToast(`✓ CORRECT! +${cs.pointsCorrect} pts`, 'correct')
  }

  /** Team 1 answered wrong — deduct if applicable, then open steal if category allows */
  const handleWrong = () => {
    stopTimer()
    processAnswer(roundId, 'wrong')  // store: logs deduction, lockQuestion=false
    const msg = cs.pointsWrong !== 0 ? `✗ WRONG! ${cs.pointsWrong} pts` : '✗ WRONG — no deduction'
    if (sm?.allowSteal) {
      setPhase('steal-offered')
      revealAnswer()
      showToast(msg + ' — opponents may steal', 'wrong')
    } else {
      setPhase('done')
      showToast(msg, 'wrong')
    }
  }

  /** Team 1 passed — open steal if category allows, otherwise just advance */
  const handlePass = () => {
    stopTimer()
    processAnswer(roundId, 'pass')  // store: advances turn, lockQuestion=false
    if (sm?.allowSteal) {
      setPhase('steal-offered')
      revealAnswer()
      showToast('→ PASSED — opponents may steal', 'pass')
    } else {
      setPhase('done')
      showToast('→ PASSED', 'pass')
    }
  }

  /** Admin picks a team to steal — starts the steal countdown */
  const handleOfferSteal = (teamId: string) => {
    setStealingTeamId(teamId)
    setPhase('team2-answering')
    const stealTeam = teams.find((t) => t.id === teamId)
    showToast(`⚡ ${stealTeam?.name} stealing — ${cs.stealTimeSecs}s`, 'steal')
    startCountdown(cs.stealTimeSecs, () => {
      setPhase('done')
      markQuestionDone()
      showToast('⏱ Steal time up — no steal scored', 'info')
    })
  }

  /** Team 2 got it right during steal */
  const handleStealCorrect = () => {
    if (!stealingTeamId) return
    stopTimer()
    setPhase('done')
    const stealTeam = teams.find((t) => t.id === stealingTeamId)
    processAnswer(roundId, 'steal', stealingTeamId)  // store: logs steal points, lockQuestion=true
    showToast(`⚡ STEAL! ${stealTeam?.name} +${cs.stealPoints} pts`, 'steal')
  }

  /** Team 2 answered wrong on steal — no points either way, close question */
  const handleStealWrong = () => {
    stopTimer()
    setPhase('done')
    markQuestionDone()
    showToast('✗ Steal missed — no points', 'wrong')
  }

  /** Admin skips the steal — no team attempts, move to next question */
  const handleSkipSteal = () => {
    setPhase('done')
    markQuestionDone()
    showToast('Steal skipped', 'info')
  }

  const handleNext = () => nextQuestion(roundId)

  const handleEndRound = () => {
    if (confirm('End this round and return to the session dashboard?')) {
      stopTimer()
      endRound(roundId)
      router.push(`/session/${sessionId}`)
    }
  }

  // ── Derived timer visuals ──────────────────────────────────────────────────
  const maxTime =
    isHotSeat ? cs?.hotSeatTimeSecs
    : phase === 'team2-answering' ? cs?.stealTimeSecs
    : cs?.answerTimeSecs

  const timerPct = maxTime ? Math.min(100, (timeLeft / maxTime) * 100) : 0
  const timerColor =
    phase === 'team2-answering' ? '#2E86DE'
    : phase === 'steal-offered'  ? '#2E86DE'
    : timerPct > 60 ? '#F5C842'
    : timerPct > 30 ? '#E67E22'
    : '#C0392B'

  const diffBadge: Record<string, string> = {
    all:    'text-[#F5C842] border-[#F5C842]/50 bg-[#F5C842]/10',
    easy:   'text-[#6DFFAA] border-[#1A8A4A]/50 bg-[#1A8A4A]/15',
    medium: 'text-[#F5C842] border-[#F5C842]/50 bg-[#F5C842]/10',
    hard:   'text-[#FF8A80] border-[#C0392B]/50 bg-[#C0392B]/15',
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
  const otherTeams = teams.filter((t) => t.id !== answeringTeamIdRef.current)
  const stealingTeam = teams.find((t) => t.id === stealingTeamId)
  const isDone = phase === 'done' || questionDone

  // Phase badge text for header
  const phaseBadge =
    phase === 'steal-offered'  ? { text: '⚡ STEAL AVAILABLE', color: '#2E86DE', bg: 'rgba(46,134,222,0.2)', border: 'rgba(46,134,222,0.5)' }
    : phase === 'team2-answering' ? { text: `⚡ ${stealingTeam?.name ?? 'Team'} STEALING`, color: '#74B9FF', bg: 'rgba(46,134,222,0.25)', border: 'rgba(46,134,222,0.6)' }
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Game header */}
      <header
        className="border-b px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.25)', background: 'linear-gradient(135deg,#142240,#1E3360)' }}
      >
        <Link href={`/session/${sessionId}`} className="text-[#9BA8C4] hover:text-[#F5C842] text-base transition-colors">←</Link>
        <div className="font-display text-lg tracking-widest text-gold-glow flex-1 truncate">{round.name}</div>
        {phaseBadge && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide animate-pulse"
            style={{ background: phaseBadge.bg, border: `1px solid ${phaseBadge.border}`, color: phaseBadge.color }}>
            {phaseBadge.text}
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

            {/* ── LEFT ───────────────────────────────────────────────────── */}
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

              {/* Current team / steal indicator */}
              <div className="panel flex items-center gap-4">
                {phase === 'steal-offered' ? (
                  <div className="flex-1">
                    <div className="text-[10px] text-[#74B9FF] uppercase tracking-widest mb-2 font-semibold">
                      ⚡ Steal available — pick which team attempts
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {otherTeams.map((t) => (
                        <span key={t.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: `${t.color}22`, border: `1px solid ${t.color}55`, color: t.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />{t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : phase === 'team2-answering' ? (
                  <div className="flex-1">
                    <div className="text-[10px] text-[#74B9FF] uppercase tracking-widest mb-0.5 font-semibold">Stealing</div>
                    <div className="font-display text-3xl tracking-wide" style={{ color: stealingTeam?.color }}>
                      {stealingTeam?.name ?? '—'}
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

                {/* Timer clock — hide during steal-offered (no countdown) */}
                {!isDone && phase !== 'steal-offered' && timeLeft > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-5xl tabular-nums leading-none"
                      style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}66` }}>
                      {timeLeft}
                    </div>
                    <div className="text-[10px] text-[#9BA8C4] mt-0.5 uppercase tracking-wide">
                      {phase === 'team2-answering' ? 'to steal' : isHotSeat ? 'remaining' : 'to answer'}
                    </div>
                  </div>
                )}
                {isDone && (
                  <div className="text-[#F5C842] font-display text-lg tracking-wider">DONE ✓</div>
                )}
              </div>

              <ActionButtons
                sm={sm}
                cs={cs}
                phase={phase}
                isDone={isDone}
                teams={teams}
                currentTeamId={round.currentTeamTurnId}
                stealingTeamId={stealingTeamId}
                otherTeams={otherTeams}
                allowSteal={sm?.allowSteal ?? false}
                allowPass={sm?.allowPass ?? false}
                isHotSeat={isHotSeat}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onPass={handlePass}
                onOfferSteal={handleOfferSteal}
                onStealCorrect={handleStealCorrect}
                onStealWrong={handleStealWrong}
                onSkipSteal={handleSkipSteal}
                onNext={handleNext}
                onEndRound={handleEndRound}
                hasNextQuestion={round.questionIndex + 1 < round.questionQueue.length}
              />
            </div>

            {/* ── RIGHT sidebar ───────────────────────────────────────────── */}
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