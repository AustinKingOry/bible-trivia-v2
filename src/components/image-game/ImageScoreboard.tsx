'use client'

import { useImageGameStore } from '@/store/imageGameStore'

interface Props { sessionId: string }

export function ImageScoreboard({ sessionId }: Props) {
  const leaderboard = useImageGameStore((s) => s.getLeaderboard(sessionId))

  return (
    <div className="panel">
      <h2 className="font-display text-base tracking-widest text-primary mb-3 pb-2"
        style={{ borderBottom: '1px solid color-mix(in oklab, var(--primary) 18%, transparent)' }}>
        SCORES
      </h2>
      {leaderboard.length === 0 ? (
        <p className="text-muted-foreground text-xs text-center py-3">No participants yet</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {leaderboard.map(({ id, name, color, score, members }, i) => (
            <div key={id}
              className="flex items-center gap-2 px-2 py-2 rounded-lg transition-all"
              style={i === 0 && score > 0
                ? { background: 'color-mix(in oklab, var(--primary) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)' }
                : { border: '1px solid transparent' }
              }>
              <span className={`font-display text-base min-w-[18px] text-center ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                {i + 1}
              </span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{name}</div>
                {members && members.length > 0 && (
                  <div className="text-[9px] text-muted-foreground truncate">{members.join(', ')}</div>
                )}
              </div>
              <span className="font-display text-xl text-primary">{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
