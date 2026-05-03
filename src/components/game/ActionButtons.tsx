'use client'

import type { ScoringMode, Team, QuestionPhase, CategorySettings } from '@/types'

interface Props {
  sm: ScoringMode | undefined
  cs: CategorySettings | undefined
  phase: QuestionPhase
  isDone: boolean
  teams: Team[]
  currentTeamId: string | null
  stealingTeamId: string | null
  otherTeams: Team[]
  allowSteal: boolean
  allowPass: boolean
  isHotSeat: boolean
  // Handlers per phase
  onCorrect: () => void
  onWrong: () => void
  onPass: () => void
  onOfferSteal: (teamId: string) => void
  onStealCorrect: () => void
  onStealWrong: () => void
  onSkipSteal: () => void
  onNext: () => void
  onEndRound: () => void
  hasNextQuestion: boolean
}

export function ActionButtons({
  sm, cs, phase, isDone,
  teams, currentTeamId, stealingTeamId, otherTeams,
  allowSteal, allowPass, isHotSeat,
  onCorrect, onWrong, onPass,
  onOfferSteal, onStealCorrect, onStealWrong, onSkipSteal,
  onNext, onEndRound, hasNextQuestion,
}: Props) {

  return (
    <div className="panel flex flex-col gap-3">
      <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase">
        Record Outcome
      </div>

      {/* ── PHASE: team1-answering ──────────────────────────────────────── */}
      {(phase === 'team1-answering' || (isHotSeat && !isDone)) && (
        <div className="grid grid-cols-2 gap-2.5">
          <Btn onClick={onCorrect} disabled={isDone}
            bg="rgba(26,138,74,0.18)" hoverBg="rgba(26,138,74,0.38)" border="#1A8A4A" color="#6DFFAA">
            <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
            <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">+{cs?.pointsCorrect ?? '?'} pts</sub>
          </Btn>

          <Btn onClick={onWrong} disabled={isDone}
            bg="rgba(192,57,43,0.18)" hoverBg="rgba(192,57,43,0.38)" border="#C0392B" color="#FF8A80">
            <span className="font-display text-xl tracking-wide">✗ WRONG</span>
            <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">
              {cs?.pointsWrong !== 0 ? `${cs?.pointsWrong} pts` : 'no deduction'}
              {!isHotSeat && allowSteal ? ' · steal opens' : ''}
            </sub>
          </Btn>

          {!isHotSeat && (
            <>
              <Btn onClick={onPass} disabled={isDone || !allowPass}
                bg="rgba(230,126,34,0.15)" hoverBg="rgba(230,126,34,0.32)" border="#E67E22" color="#FFB347">
                <span className="font-display text-xl tracking-wide">→ PASS</span>
                <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">
                  {allowPass ? (allowSteal ? 'opens steal' : 'no pts') : 'not allowed'}
                </sub>
              </Btn>

              {/* Steal button is inactive during team1 answering — shown dimmed as a reminder */}
              <Btn onClick={() => {}} disabled={true}
                bg="rgba(46,134,222,0.08)" hoverBg="rgba(46,134,222,0.08)" border="rgba(46,134,222,0.2)" color="rgba(116,185,255,0.35)">
                <span className="font-display text-xl tracking-wide">⚡ STEAL</span>
                <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">
                  {allowSteal ? 'after wrong/pass' : 'N/A'}
                </sub>
              </Btn>
            </>
          )}
        </div>
      )}

      {/* ── PHASE: steal-offered ────────────────────────────────────────── */}
      {phase === 'steal-offered' && (
        <div className="flex flex-col gap-2.5 animate-slide-up">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(46,134,222,0.1)', border: '1px solid rgba(46,134,222,0.35)', color: '#74B9FF' }}>
            <span className="text-base">⚡</span>
            Question passed — which team attempts to steal?
          </div>

          {/* One button per opponent team */}
          <div className="flex flex-col gap-2">
            {otherTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => onOfferSteal(t.id)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold text-sm text-left transition-all"
                style={{ background: 'rgba(46,134,222,0.15)', border: '2px solid rgba(46,134,222,0.5)', color: '#74B9FF',
                  boxShadow: '0 0 12px rgba(46,134,222,0.2)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(46,134,222,0.3)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(46,134,222,0.15)')}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="flex-1">{t.name} steals</span>
                <span className="font-display text-lg tracking-wide">⚡ +{cs?.stealPoints} pts →</span>
              </button>
            ))}
          </div>

          {/* Skip steal — go straight to next */}
          <button
            onClick={onSkipSteal}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#9BA8C4' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            No steal — skip to next question
          </button>
        </div>
      )}

      {/* ── PHASE: team2-answering ───────────────────────────────────────── */}
      {phase === 'team2-answering' && (
        <div className="flex flex-col gap-2.5 animate-slide-up">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(46,134,222,0.12)', border: '1px solid rgba(46,134,222,0.4)', color: '#74B9FF' }}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: teams.find(t => t.id === stealingTeamId)?.color }} />
            {teams.find(t => t.id === stealingTeamId)?.name} is answering — no further steal possible
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Btn onClick={onStealCorrect} disabled={false}
              bg="rgba(26,138,74,0.18)" hoverBg="rgba(26,138,74,0.38)" border="#1A8A4A" color="#6DFFAA">
              <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
              <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">+{cs?.stealPoints ?? '?'} pts</sub>
            </Btn>

            <Btn onClick={onStealWrong} disabled={false}
              bg="rgba(192,57,43,0.18)" hoverBg="rgba(192,57,43,0.38)" border="#C0392B" color="#FF8A80">
              <span className="font-display text-xl tracking-wide">✗ WRONG</span>
              <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">no steal scored</sub>
            </Btn>
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onNext}
          disabled={!isDone}
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
  children, onClick, disabled, bg, hoverBg, border, color,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  bg: string; hoverBg: string; border: string; color: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-lg transition-all disabled:cursor-not-allowed"
      style={{ background: bg, border: `2px solid ${border}`, color, opacity: disabled ? 0.25 : 1 }}
      onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = hoverBg }}
      onMouseOut={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = bg }}
    >
      {children}
    </button>
  )
}