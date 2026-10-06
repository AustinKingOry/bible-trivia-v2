'use client'

import type { Category, Question, QuestionPhase } from '@/types'

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
  phase: QuestionPhase
  topicTag?: string
  topicLabel?: { emoji: string; label: string }
}

export function QuestionPanel({
  question, cat, difficulty, diffBadge,
  qIdx, qTotal, answerRevealed, onReveal,
  isHotSeat, timerPct, timerColor, timeLeft, phase,
  topicTag, topicLabel,
}: Props) {
  if (!question || !cat) {
    return (
      <div className="panel-gold flex items-center justify-center py-16 text-muted-foreground">
        No more questions in this round.
      </div>
    )
  }

  const isStealPhase = phase === 'steal-offered' || phase === 'team2-answering'
  const isDone = phase === 'done'
  const borderColor = isStealPhase ? 'var(--info)' : isDone ? 'color-mix(in oklab, var(--primary) 40%, transparent)' : 'var(--primary)'
  const showTimerBar = timeLeft > 0 && phase !== 'steal-offered'

  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-5 transition-all"
      style={{
        background: 'var(--card)',
        border: `2px solid ${borderColor}`,
        boxShadow: isStealPhase ? '0 0 28px color-mix(in oklab, var(--info) 20%, transparent)' : undefined,
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
          style={{ background: 'color-mix(in oklab, var(--secondary) 18%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)', color: 'var(--secondary)' }}
        >
          {cat.icon} {cat.name}
        </span>

        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${diffBadge[question.difficulty] ?? diffBadge[difficulty] ?? ''}`}>
          {question.difficulty}
        </span>
        {topicLabel && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
            style={{ background: 'color-mix(in oklab, var(--secondary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 35%, transparent)', color: 'var(--secondary)' }}>
            {topicLabel.emoji} {topicLabel.label}
          </span>
        )}

        {/* Phase badge inside card */}
        {phase === 'steal-offered' && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase animate-pulse"
            style={{ background: 'color-mix(in oklab, var(--info) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--info) 50%, transparent)', color: 'var(--info)' }}>
            ⚡ Steal available
          </span>
        )}
        {phase === 'team2-answering' && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
            style={{ background: 'color-mix(in oklab, var(--info) 25%, transparent)', border: '1px solid color-mix(in oklab, var(--info) 60%, transparent)', color: 'var(--info)' }}>
            ⚡ Steal attempt
          </span>
        )}

        <span className="ml-auto text-xs text-muted-foreground">Q {qIdx} / {qTotal}</span>
      </div>

      {/* Timer bar — hidden during steal-offered (no countdown running) */}
      {showTimerBar && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'color-mix(in oklab, var(--foreground) 8%, transparent)' }}>
          <div
            className="h-full rounded-full timer-bar"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>
      )}

      {/* Question text */}
      <p className="text-xl font-medium leading-relaxed text-foreground min-h-[72px]">
        {question.question}
      </p>

      {/* Answer section */}
      {answerRevealed ? (
        <div className="animate-slide-up">
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">Answer</div>
          <div
            className="px-4 py-3 rounded-lg text-base font-semibold text-success"
            style={{ background: 'color-mix(in oklab, var(--success-solid) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--success-solid) 40%, transparent)' }}
          >
            {question.answer}
          </div>

          {/* True/False detail */}
          {question.trueFalseFields && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-sm font-display text-base tracking-wide"
                style={question.trueFalseFields.isTrue
                  ? { background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)', color: 'var(--success)' }
                  : { background: 'color-mix(in oklab, var(--danger-solid) 20%, transparent)', color: 'var(--danger)' }}
              >
                {question.trueFalseFields.isTrue ? 'TRUE' : 'FALSE'}
              </span>
              {question.trueFalseFields.explanation && (
                <span className="text-xs text-muted-foreground">{question.trueFalseFields.explanation}</span>
              )}
            </div>
          )}

          {/* Open verse detail */}
          {question.openVerseFields && (
            <div className="mt-2 text-xs text-muted-foreground">
              📜 {question.openVerseFields.book} {question.openVerseFields.chapter}:{question.openVerseFields.verse}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onReveal}
          className="self-start px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
          style={{ background: 'color-mix(in oklab, var(--success-solid) 10%, transparent)', border: '1.5px solid color-mix(in oklab, var(--success-solid) 40%, transparent)', color: 'var(--success)' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--success-solid) 25%, transparent)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--success-solid) 10%, transparent)')}
        >
          REVEAL ANSWER
        </button>
      )}
    </div>
  )
}