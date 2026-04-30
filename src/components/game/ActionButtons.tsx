'use client'

import { useState } from 'react'
import type { ScoringMode, Team, TimerPhase, CategorySettings } from '@/types'

interface Props {
  sm: ScoringMode | undefined
  cs: CategorySettings | undefined
  questionDone: boolean
  phase: TimerPhase
  teams: Team[]
  currentTeamId: string | null
  onAnswer: (result: 'correct' | 'wrong' | 'pass') => void
  onSteal: (teamId: string) => void
  onNext: () => void
  onEndRound: () => void
  hasNextQuestion: boolean
}

export function ActionButtons({
  sm, cs, questionDone, phase,
  teams, currentTeamId,
  onAnswer, onSteal, onNext, onEndRound, hasNextQuestion,
}: Props) {
  const [showStealPicker, setShowStealPicker] = useState(false)
  const otherTeams = teams.filter((t) => t.id !== currentTeamId)

  const isStealWindow = phase === 'steal-window'

  // During steal window: only steal is active; correct/wrong/pass are locked
  const correctDisabled  = questionDone || isStealWindow
  const wrongDisabled    = questionDone || isStealWindow
  const passDisabled     = !sm?.allowPass || questionDone || isStealWindow
  const stealDisabled    = !sm?.allowSteal || questionDone || (!isStealWindow && phase === 'answering')

  const handleSteal = (teamId: string) => {
    setShowStealPicker(false)
    onSteal(teamId)
  }

  const handleAnswer = (result: 'correct' | 'wrong' | 'pass') => {
    setShowStealPicker(false)
    onAnswer(result)
  }

  return (
    <div className="panel flex flex-col gap-3">
      <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase">
        Record Outcome
      </div>

      {/* Phase hint */}
      {isStealWindow && !questionDone && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold animate-slide-up"
          style={{ background: 'rgba(46,134,222,0.1)', border: '1px solid rgba(46,134,222,0.35)', color: '#74B9FF' }}
        >
          <span className="text-base">⚡</span>
          Steal window open — pick a team to steal, or wait for it to close
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Btn
          disabled={correctDisabled}
          onClick={() => handleAnswer('correct')}
          bg="rgba(26,138,74,0.18)" hoverBg="rgba(26,138,74,0.38)"
          border="#1A8A4A" color="#6DFFAA"
          dimmed={isStealWindow}
        >
          <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
          <sub className="font-body text-[10px] opacity-70 uppercase tracking-wide not-italic">
            +{cs?.pointsCorrect ?? '?'} pts
          </sub>
        </Btn>

        <Btn
          disabled={wrongDisabled}
          onClick={() => handleAnswer('wrong')}
          bg="rgba(192,57,43,0.18)" hoverBg="rgba(192,57,43,0.38)"
          border="#C0392B" color="#FF8A80"
          dimmed={isStealWindow}
        >
          <span className="font-display text-xl tracking-wide">✗ WRONG</span>
          <sub className="font-body text-[10px] opacity-70 uppercase tracking-wide not-italic">
            {cs?.pointsWrong !== 0 ? `${cs?.pointsWrong} pts` : 'no deduction'}
          </sub>
        </Btn>

        <Btn
          disabled={passDisabled}
          onClick={() => handleAnswer('pass')}
          bg="rgba(230,126,34,0.15)" hoverBg="rgba(230,126,34,0.32)"
          border="#E67E22" color="#FFB347"
          dimmed={isStealWindow}
        >
          <span className="font-display text-xl tracking-wide">→ PASS</span>
          <sub className="font-body text-[10px] opacity-70 uppercase tracking-wide not-italic">no pts</sub>
        </Btn>

        <Btn
          disabled={stealDisabled}
          onClick={() => setShowStealPicker((v) => !v)}
          bg={isStealWindow ? 'rgba(46,134,222,0.25)' : 'rgba(46,134,222,0.15)'}
          hoverBg="rgba(46,134,222,0.4)"
          border={isStealWindow ? '#2E86DE' : 'rgba(46,134,222,0.5)'}
          color="#74B9FF"
          glow={isStealWindow}
        >
          <span className="font-display text-xl tracking-wide">⚡ STEAL</span>
          <sub className="font-body text-[10px] opacity-70 uppercase tracking-wide not-italic">
            {sm?.allowSteal ? `+${cs?.stealPoints} pts` : 'N/A'}
          </sub>
        </Btn>
      </div>

      {/* Steal picker */}
      {showStealPicker && !questionDone && (
        <div
          className="rounded-lg p-3 animate-slide-up"
          style={{ background: 'rgba(46,134,222,0.08)', border: '1px solid rgba(46,134,222,0.3)' }}
        >
          <div className="text-[10px] font-bold tracking-widest text-[#74B9FF] uppercase mb-2">
            Which team steals?
          </div>
          <div className="flex flex-col gap-1.5">
            {otherTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSteal(t.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-all"
                style={{ background: 'rgba(46,134,222,0.1)', border: '1px solid rgba(46,134,222,0.25)', color: '#74B9FF' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(46,134,222,0.28)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(46,134,222,0.1)')}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onNext}
          disabled={!questionDone}
          className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
          onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {hasNextQuestion ? 'NEXT QUESTION →' : 'FINISH ROUND →'}
        </button>
        <button
          onClick={onEndRound}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.35)', color: '#F1948A' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.25)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.1)')}
        >
          End Round
        </button>
      </div>
    </div>
  )
}

function Btn({
  children, onClick, disabled, bg, hoverBg, border, color, dimmed, glow,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  bg: string; hoverBg: string; border: string; color: string
  dimmed?: boolean
  glow?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-lg transition-all disabled:cursor-not-allowed"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        color,
        opacity: disabled && !glow ? (dimmed ? 0.2 : 0.25) : 1,
        boxShadow: glow ? `0 0 16px ${border}66` : undefined,
      }}
      onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = hoverBg }}
      onMouseOut={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = bg }}
    >
      {children}
    </button>
  )
}