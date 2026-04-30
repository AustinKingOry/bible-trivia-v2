'use client'

import { useGameStore } from '@/store/gameStore'

interface Props {
  sessionId: string
  roundId: string
  currentTeamId: string | null
}

export function Scoreboard({ sessionId, roundId, currentTeamId }: Props) {
  const leaderboard = useGameStore((s) => s.getLeaderboard(sessionId, roundId))

  return (
    <div className="panel">
      <h2 className="font-display text-lg tracking-widest text-[#F5C842] mb-3 pb-2"
        style={{ borderBottom: '1px solid rgba(245,200,66,0.18)' }}>
        SCOREBOARD
      </h2>
      <div className="flex flex-col gap-1.5">
        {leaderboard.map(({ team, score, rank }) => {
          const isCurrent = team.id === currentTeamId
          return (
            <div
              key={team.id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all"
              style={isCurrent
                ? { background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.28)' }
                : { border: '1px solid transparent' }
              }
            >
              <span className={`font-display text-lg min-w-[20px] text-center ${rank === 1 ? 'text-[#F5C842]' : 'text-[#9BA8C4]'}`}>
                {rank}
              </span>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: team.color }} />
              <span className="flex-1 text-sm font-semibold truncate">{team.name}</span>
              <span className="font-display text-2xl text-[#F5C842]">{score}</span>
              {isCurrent && <span className="text-[#F5C842] text-sm animate-turn-pulse">▶</span>}
            </div>
          )
        })}
        {leaderboard.length === 0 && (
          <p className="text-[#9BA8C4] text-xs text-center py-3">No teams yet</p>
        )}
      </div>
    </div>
  )
}
