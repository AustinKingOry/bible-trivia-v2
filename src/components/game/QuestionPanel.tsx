'use client'

import type { Category, Question, TimerPhase } from '@/types'

interface Props {
  question: Question | undefined
  cat: Category | undefined
  difficulty: string
  diffBadge: Record<string, string>
  qIdx: number
  qTotal: number
  answerRevealed: boolean
  onReveal: () => void
  isHotSeat: boolean
  timerPct: number
  timerColor: string
  timeLeft: number
  phase: TimerPhase
}

export function QuestionPanel({
  question, cat, difficulty, diffBadge,
  qIdx, qTotal, answerRevealed, onReveal,
  isHotSeat, timerPct, timerColor, timeLeft, phase,
}: Props) {
  if (!question || !cat) {
    return (
      <div className="panel-gold flex items-center justify-center py-16 text-[#9BA8C4]">
        No more questions in this round.
      </div>
    )
  }

  const isStealWindow = phase === 'steal-window'
  const borderColor = isStealWindow ? '#2E86DE' : '#F5C842'

  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-5 transition-all"
      style={{
        background: '#142240',
        border: `2px solid ${borderColor}`,
        boxShadow: isStealWindow ? `0 0 24px rgba(46,134,222,0.25)` : undefined,
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
          style={{ background: 'rgba(123,47,190,0.18)', border: '1px solid rgba(123,47,190,0.4)', color: '#C084FC' }}
        >
          {cat.icon} {cat.name}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${diffBadge[difficulty] ?? ''}`}>
          {difficulty}
        </span>
        {isStealWindow && (
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase animate-pulse"
            style={{ background: 'rgba(46,134,222,0.2)', border: '1px solid rgba(46,134,222,0.5)', color: '#74B9FF' }}
          >
            ⚡ Steal window
          </span>
        )}
        <span className="ml-auto text-xs text-[#9BA8C4]">Q {qIdx} / {qTotal}</span>
      </div>

      {/* Timer bar — shown for all modes while active */}
      {timeLeft > 0 && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full timer-bar"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>
      )}

      {/* Question text */}
      <p className="text-xl font-medium leading-relaxed text-[#F0EDD8] min-h-[72px]">
        {question.question}
      </p>

      {/* Answer */}
      {answerRevealed ? (
        <div className="animate-slide-up">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-1.5">Answer</div>
          <div
            className="px-4 py-3 rounded-lg text-base font-semibold text-[#6DFFAA]"
            style={{ background: 'rgba(26,138,74,0.15)', border: '1px solid rgba(26,138,74,0.4)' }}
          >
            {question.answer}
          </div>
          {/* Structured detail: True/False indicator */}
          {question.trueFalseFields && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="px-3 py-1 rounded font-display text-base tracking-wide"
                style={
                  question.trueFalseFields.isTrue
                    ? { background: 'rgba(26,138,74,0.2)', color: '#6DFFAA' }
                    : { background: 'rgba(192,57,43,0.2)', color: '#FF8A80' }
                }
              >
                {question.trueFalseFields.isTrue ? 'TRUE' : 'FALSE'}
              </span>
              {question.trueFalseFields.explanation && (
                <span className="text-xs text-[#9BA8C4]">{question.trueFalseFields.explanation}</span>
              )}
            </div>
          )}
          {/* Open verse detail */}
          {question.openVerseFields && (
            <div className="mt-2 text-xs text-[#9BA8C4]">
              📜 {question.openVerseFields.book} {question.openVerseFields.chapter}:{question.openVerseFields.verse}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onReveal}
          className="self-start px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
          style={{ background: 'rgba(26,138,74,0.1)', border: '1.5px solid rgba(26,138,74,0.4)', color: '#6DFFAA' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(26,138,74,0.25)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(26,138,74,0.1)')}
        >
          REVEAL ANSWER
        </button>
      )}
    </div>
  )
}