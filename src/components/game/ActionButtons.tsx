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
      <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        Record Outcome
      </div>

      {/* ── PHASE: team1-answering ──────────────────────────────────────── */}
      {(phase === 'team1-answering' || (isHotSeat && !isDone)) && (
        <div className="grid grid-cols-2 gap-2.5">
          <Btn onClick={onCorrect} disabled={isDone}
            bg="color-mix(in oklab, var(--success-solid) 18%, transparent)" hoverBg="color-mix(in oklab, var(--success-solid) 38%, transparent)" border="var(--success-solid)" color="var(--success)">
            <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
            <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">+{cs?.pointsCorrect ?? '?'} pts</sub>
          </Btn>

          <Btn onClick={onWrong} disabled={isDone}
            bg="color-mix(in oklab, var(--danger-solid) 18%, transparent)" hoverBg="color-mix(in oklab, var(--danger-solid) 38%, transparent)" border="var(--danger-solid)" color="var(--danger)">
            <span className="font-display text-xl tracking-wide">✗ WRONG</span>
            <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">
              {cs?.pointsWrong !== 0 ? `${cs?.pointsWrong} pts` : 'no deduction'}
              {!isHotSeat && allowSteal ? ' · steal opens' : ''}
            </sub>
          </Btn>

          {!isHotSeat && (
            <>
              <Btn onClick={onPass} disabled={isDone || !allowPass}
                bg="color-mix(in oklab, var(--secondary) 15%, transparent)" hoverBg="color-mix(in oklab, var(--secondary) 32%, transparent)" border="var(--secondary)" color="var(--secondary)">
                <span className="font-display text-xl tracking-wide">→ PASS</span>
                <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">
                  {allowPass ? (allowSteal ? 'opens steal' : 'no pts') : 'not allowed'}
                </sub>
              </Btn>

              {/* Steal button is inactive during team1 answering — shown dimmed as a reminder */}
              <Btn onClick={() => {}} disabled={true}
                bg="color-mix(in oklab, var(--info) 8%, transparent)" hoverBg="color-mix(in oklab, var(--info) 8%, transparent)" border="color-mix(in oklab, var(--info) 20%, transparent)" color="color-mix(in oklab, var(--info) 35%, transparent)">
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
            style={{ background: 'color-mix(in oklab, var(--info) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--info) 35%, transparent)', color: 'var(--info)' }}>
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
                style={{ background: 'color-mix(in oklab, var(--info) 15%, transparent)', border: '2px solid color-mix(in oklab, var(--info) 50%, transparent)', color: 'var(--info)',
                  boxShadow: '0 0 12px color-mix(in oklab, var(--info) 20%, transparent)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--info) 30%, transparent)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--info) 15%, transparent)')}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="flex-1">{t.name} steals</span>
                <span className="font-display text-lg tracking-wide">⚡ +{cs?.stealPoints} pts →</span>
              </button>
            ))}
          </div>

          {/* Skip steal — go straight to next */}
          <button
            onClick={onSkipSteal}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'color-mix(in oklab, var(--foreground) 5%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 12%, transparent)', color: 'var(--muted-foreground)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--foreground) 10%, transparent)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--foreground) 5%, transparent)')}
          >
            No steal — skip to next question
          </button>
        </div>
      )}

      {/* ── PHASE: team2-answering ───────────────────────────────────────── */}
      {phase === 'team2-answering' && (
        <div className="flex flex-col gap-2.5 animate-slide-up">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold"
            style={{ background: 'color-mix(in oklab, var(--info) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--info) 40%, transparent)', color: 'var(--info)' }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: teams.find(t => t.id === stealingTeamId)?.color }} />
            {teams.find(t => t.id === stealingTeamId)?.name} is answering — no further steal possible
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Btn onClick={onStealCorrect} disabled={false}
              bg="color-mix(in oklab, var(--success-solid) 18%, transparent)" hoverBg="color-mix(in oklab, var(--success-solid) 38%, transparent)" border="var(--success-solid)" color="var(--success)">
              <span className="font-display text-xl tracking-wide">✓ CORRECT</span>
              <sub className="text-[10px] opacity-70 uppercase tracking-wide not-italic">+{cs?.stealPoints ?? '?'} pts</sub>
            </Btn>

            <Btn onClick={onStealWrong} disabled={false}
              bg="color-mix(in oklab, var(--danger-solid) 18%, transparent)" hoverBg="color-mix(in oklab, var(--danger-solid) 38%, transparent)" border="var(--danger-solid)" color="var(--danger)">
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
          style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
          onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {hasNextQuestion ? 'NEXT QUESTION →' : 'FINISH ROUND →'}
        </button>
        <button
          onClick={onEndRound}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'color-mix(in oklab, var(--danger-solid) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--danger-solid) 35%, transparent)', color: 'var(--danger)' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 25%, transparent)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 10%, transparent)')}
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