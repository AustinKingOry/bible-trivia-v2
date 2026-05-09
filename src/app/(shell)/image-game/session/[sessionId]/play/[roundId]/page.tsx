'use client'

import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useImageGameStore } from '@/store/imageGameStore'
import { showToast } from '@/components/shared/Toast'
import { useTones } from '@/hooks/useTones'
import { ImageScoreboard } from '@/components/image-game/ImageScoreboard'

export default function ImagePlayPage({
  params,
}: { params: Promise<{ sessionId: string; roundId: string }> }) {
  const { sessionId, roundId } = use(params)
  const router = useRouter()
  const { play: playTone } = useTones()

  const { sessions, recordAnswer, nextQuestion, rotateParticipantQueue, endRound, getCurrentQuestion } = useImageGameStore()
  const session = sessions[sessionId]
  const round = session?.rounds.find((r) => r.id === roundId)
  const question = getCurrentQuestion(sessionId, roundId)

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(round?.answerTimeSecs ?? 30)
  const [timerRunning, setTimerRunning] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [revealAnswer, setRevealAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setTimerRunning(false)
  }, [])

  const startTimer = useCallback(() => {
    if (!round) return
    stopTimer()
    setTimeLeft(round.answerTimeSecs)
    setTimerRunning(true)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!); timerRef.current = null
          setTimerRunning(false)
          setAnswered(true)
          setRevealAnswer(true)
          playTone('timeout')
          showToast('⏱ Time up!', 'pass')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [round, stopTimer, playTone])

  // Reset state when question changes
  useEffect(() => {
    setAnswered(false)
    setRevealAnswer(false)
    setShowHint(false)
    startTimer()
    return stopTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.questionIndex])

  if (!session || !round) return (
    <div className="flex items-center justify-center h-full text-[#9BA8C4]">
      <div className="text-center">
        <p className="text-xl mb-3">Round not found.</p>
        <Link href={`/image-game/session/${sessionId}`} className="text-[#F5C842] underline">← Back</Link>
      </div>
    </div>
  )

  if (round.status === 'completed') {
    router.replace(`/image-game/session/${sessionId}`)
    return null
  }

  const currentParticipantId = round.participantQueue[0]
  const currentParticipant = session.participants.find((p) => p.id === currentParticipantId)
  const qIdx = round.questionIndex + 1
  const qTotal = round.questionQueue.length

  // Timer visuals
  const timerPct = (timeLeft / round.answerTimeSecs) * 100
  const timerColor = timerPct > 60 ? '#F5C842' : timerPct > 30 ? '#E67E22' : '#C0392B'

  const handleResult = (result: 'correct' | 'wrong' | 'skip') => {
    stopTimer()
    recordAnswer(sessionId, roundId, result)
    setAnswered(true)
    setRevealAnswer(true)
    if (result === 'correct') playTone('correct')
    else if (result === 'wrong') playTone('wrong')
    else playTone('pass')

    const msgs = {
      correct: `✓ CORRECT! +${round.pointsCorrect} pts`,
      wrong: '✗ WRONG',
      skip: '→ SKIPPED',
    }
    showToast(msgs[result], result === 'correct' ? 'correct' : result === 'wrong' ? 'wrong' : 'pass')
  }

  const handleNext = () => {
    nextQuestion(sessionId, roundId)
  }

  const handleEndRound = () => {
    if (confirm('End this round?')) {
      stopTimer()
      playTone('complete')
      endRound(sessionId, roundId)
      router.push(`/image-game/session/${sessionId}`)
    }
  }

  // Queue display — next 4 after current
  const queueDisplay = round.participantQueue.slice(0, 5).map((pid) =>
    session.participants.find((p) => p.id === pid)
  ).filter(Boolean)

  const diffBadge: Record<string, string> = {
    easy: 'text-[#6DFFAA] border-emerald-600/40 bg-emerald-900/20',
    medium: 'text-[#F5C842] border-yellow-600/40 bg-yellow-900/10',
    hard: 'text-[#FF8A80] border-red-700/40 bg-red-900/15',
    all: 'text-[#F5C842] border-yellow-600/40 bg-yellow-900/10',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.25)', background: 'linear-gradient(135deg,#142240,#1E3360)' }}>
        <Link href={`/image-game/session/${sessionId}`}
          className="text-[#9BA8C4] hover:text-[#F5C842] text-base transition-colors">←</Link>
        <div className="font-display text-lg tracking-widest text-gold-glow flex-1 truncate">{round.name}</div>
        {round.topicTag && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.4)', color: '#C084FC' }}>
            🏷️ {round.topicTag}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-xs text-[#9BA8C4] flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6DFFAA] animate-pulse" />
          {qIdx}/{qTotal}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">

          {/* Image display — the star of the show */}
          <div className="relative flex-1 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ minHeight: '320px', background: '#0A1628', border: '2px solid rgba(245,200,66,0.3)' }}>
            {question?.imageUrl ? (
              <img
                src={question.imageUrl}
                alt="Identify this"
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '480px' }}
                draggable={false}
              />
            ) : (
              <div className="text-[#9BA8C4] text-center">
                <div className="text-5xl mb-3">🖼️</div>
                <p>No image for this question</p>
              </div>
            )}

            {/* Timer bar overlay at bottom */}
            {!answered && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="h-full transition-all" style={{
                  width: `${timerPct}%`,
                  background: timerColor,
                  transition: 'width 1s linear, background-color 0.5s',
                }} />
              </div>
            )}

            {/* Q badges top-left */}
            <div className="absolute top-3 left-3 flex gap-2">
              {question?.difficulty && question.difficulty !== 'all' && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${diffBadge[question.difficulty]}`}>
                  {question.difficulty}
                </span>
              )}
              {question?.topicTag && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: 'rgba(123,47,190,0.3)', border: '1px solid rgba(123,47,190,0.5)', color: '#C084FC' }}>
                  {question.topicTag}
                </span>
              )}
            </div>

            {/* Timer clock top-right */}
            {!answered && (
              <div className="absolute top-3 right-3 font-display text-5xl tabular-nums"
                style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}88` }}>
                {timeLeft}
              </div>
            )}
          </div>

          {/* Answer reveal */}
          {revealAnswer && question && (
            <div className="rounded-xl px-5 py-4 animate-slide-up"
              style={{ background: 'rgba(26,138,74,0.15)', border: '1.5px solid rgba(26,138,74,0.5)' }}>
              <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-1">Answer</div>
              <div className="text-xl font-bold text-[#6DFFAA]">{question.answer}</div>
              {question.hint && (
                <div className="text-xs text-[#9BA8C4] mt-1">💡 {question.hint}</div>
              )}
            </div>
          )}

          {!revealAnswer && question?.hint && (
            <button onClick={() => setShowHint(true)}
              className="self-start px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.35)', color: '#FFB347' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(230,126,34,0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(230,126,34,0.12)')}>
              {showHint ? `💡 Hint: ${question.hint}` : '💡 Show Hint'}
            </button>
          )}

          {/* Action buttons */}
          <div className="panel flex flex-col gap-3">
            <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase">
              {answered ? 'Question done' : `${currentParticipant?.name ?? '—'} is answering`}
            </div>

            {!answered ? (
              <div className="grid grid-cols-3 gap-2.5">
                <Btn onClick={() => handleResult('correct')}
                  bg="rgba(26,138,74,0.18)" hoverBg="rgba(26,138,74,0.38)" border="#1A8A4A" color="#6DFFAA">
                  <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
                  <sub className="text-[10px] opacity-70 not-italic uppercase">+{round.pointsCorrect} pts</sub>
                </Btn>
                <Btn onClick={() => handleResult('wrong')}
                  bg="rgba(192,57,43,0.18)" hoverBg="rgba(192,57,43,0.38)" border="#C0392B" color="#FF8A80">
                  <span className="font-display text-xl tracking-wide">✗ WRONG</span>
                  <sub className="text-[10px] opacity-70 not-italic uppercase">
                    {round.pointsWrong > 0 ? `-${round.pointsWrong} pts` : 'no deduction'}
                  </sub>
                </Btn>
                <Btn onClick={() => handleResult('skip')}
                  bg="rgba(230,126,34,0.15)" hoverBg="rgba(230,126,34,0.32)" border="#E67E22" color="#FFB347">
                  <span className="font-display text-xl tracking-wide">→ SKIP</span>
                  <sub className="text-[10px] opacity-70 not-italic uppercase">no pts</sub>
                </Btn>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleNext}
                  className="flex-1 py-3.5 rounded-lg font-display text-xl tracking-widest transition-all"
                  style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}>
                  {round.questionIndex + 1 < round.questionQueue.length ? 'NEXT IMAGE →' : 'FINISH ROUND →'}
                </button>
              </div>
            )}

            <button onClick={handleEndRound}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.35)', color: '#F1948A' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.1)')}>
              End Round
            </button>
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 p-4 border-l overflow-y-auto"
          style={{ borderColor: 'rgba(245,200,66,0.12)' }}>

          {/* Current answerer */}
          <div className="panel">
            <div className="text-[10px] text-[#9BA8C4] uppercase tracking-widest mb-2 font-semibold">Now Answering</div>
            {currentParticipant ? (
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: currentParticipant.color }} />
                <div>
                  <div className="font-display text-lg tracking-wide" style={{ color: currentParticipant.color }}>
                    {currentParticipant.name}
                  </div>
                  {currentParticipant.members && currentParticipant.members.length > 0 && (
                    <div className="text-[10px] text-[#9BA8C4] mt-0.5">
                      {currentParticipant.members.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[#9BA8C4] text-sm">No participants</p>
            )}
          </div>

          {/* Queue */}
          <div className="panel">
            <div className="text-[10px] text-[#9BA8C4] uppercase tracking-widest mb-3 font-semibold">Queue</div>
            <div className="flex flex-col gap-2">
              {queueDisplay.map((p, i) => p && (
                <div key={p.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg"
                  style={i === 0
                    ? { background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)' }
                    : { opacity: 0.6 + i * 0.05 }
                  }>
                  <span className="font-display text-sm min-w-[18px] text-center text-[#9BA8C4]">{i + 1}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-xs font-semibold text-[#F0EDD8] truncate">{p.name}</span>
                  {i === 0 && <span className="text-[#F5C842] text-xs animate-turn-pulse ml-auto">▶</span>}
                </div>
              ))}
              {round.participantQueue.length > 5 && (
                <p className="text-[9px] text-[#4A5568] text-center">
                  +{round.participantQueue.length - 5} more
                </p>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <ImageScoreboard sessionId={sessionId} />
        </div>
      </div>
    </div>
  )
}

function Btn({ children, onClick, bg, hoverBg, border, color }: {
  children: React.ReactNode
  onClick: () => void
  bg: string; hoverBg: string; border: string; color: string
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-lg transition-all"
      style={{ background: bg, border: `2px solid ${border}`, color }}
      onMouseOver={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseOut={(e) => (e.currentTarget.style.background = bg)}>
      {children}
    </button>
  )
}
