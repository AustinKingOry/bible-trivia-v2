'use client'

import { useGameStore } from '@/store/gameStore'

export function Leaderboard({ sessionId }: { sessionId: string }) {
  const leaderboard = useGameStore((s) => s.getLeaderboard(sessionId))
  const rounds = useGameStore((s) => s.getSessionRounds(sessionId))
  const sessionActivities = useGameStore((s) =>
    Object.values(s.activities).filter((a) => a.sessionId === sessionId)
  )

  const completedRounds = rounds.filter((r) => r.status === 'completed')
  const totalCorrect = sessionActivities.filter((a) => a.reason === 'correct').length
  const totalSteals = sessionActivities.filter((a) => a.reason === 'steal').length

  const medal = (rank: number) => ['🥇','🥈','🥉'][rank - 1] ?? `${rank}.`

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rounds Done', value: completedRounds.length },
          { label: 'Correct', value: totalCorrect },
          { label: 'Steals', value: totalSteals },
        ].map((s) => (
          <div key={s.label} className="panel-sm text-center">
            <div className="font-display text-3xl text-[#F5C842]">{s.value}</div>
            <div className="text-[10px] text-[#9BA8C4] uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2 className="font-display text-xl tracking-widest text-[#F5C842] mb-4 pb-2"
          style={{ borderBottom: '1px solid rgba(245,200,66,0.18)' }}>
          OVERALL STANDINGS
        </h2>
        {leaderboard.length === 0 ? (
          <p className="text-[#9BA8C4] text-sm text-center py-6">Add teams to see standings.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map(({ team, score, rank }) => (
              <div key={team.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                style={rank === 1
                  ? { background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)' }
                  : { borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xl min-w-[32px]">{medal(rank)}</span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: team.color }} />
                <span className="flex-1 font-semibold text-[#F0EDD8]">{team.name}</span>
                <span className="font-display text-3xl text-[#F5C842]">{score}</span>
                <span className="text-xs text-[#9BA8C4]">pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {completedRounds.length > 0 && (
        <div className="panel">
          <h2 className="font-display text-lg tracking-widest text-[#F5C842] mb-4 pb-2"
            style={{ borderBottom: '1px solid rgba(245,200,66,0.18)' }}>
            ROUND BREAKDOWN
          </h2>
          {completedRounds.map((round) => {
            const roundLB = useGameStore.getState().getLeaderboard(sessionId, round.id)
            return (
              <div key={round.id} className="mb-4 last:mb-0">
                <div className="text-xs font-semibold text-[#9BA8C4] mb-2 uppercase tracking-wide">{round.name}</div>
                {roundLB.slice(0, 4).map(({ team, score, rank }) => (
                  <div key={team.id} className="flex items-center gap-2 py-1 text-sm">
                    <span className="text-[#9BA8C4] min-w-[18px] text-xs">{rank}.</span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: team.color }} />
                    <span className="flex-1 text-[#F0EDD8]">{team.name}</span>
                    <span className={`font-semibold ${score >= 0 ? 'text-[#F5C842]' : 'text-red-400'}`}>
                      {score > 0 ? '+' : ''}{score}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
