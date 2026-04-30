'use client'

import { useGameStore } from '@/store/gameStore'
import type { Team } from '@/types'

const DOT: Record<string, string> = {
  correct: '#1A8A4A',
  wrong: '#C0392B',
  steal: '#2E86DE',
}

export function ActivityFeed({ roundId, teams }: { roundId: string; teams: Team[] }) {
  const activities = useGameStore((s) => s.getRoundActivities(roundId))

  const getTeam = (id: string) => teams.find((t) => t.id === id)

  return (
    <div className="panel flex flex-col" style={{ maxHeight: '260px' }}>
      <h2 className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-3 flex-shrink-0">
        Activity Log
      </h2>
      <div className="flex flex-col gap-1 overflow-y-auto flex-1">
        {activities.length === 0 && (
          <p className="text-[#9BA8C4] text-xs text-center py-4">No activity yet</p>
        )}
        {activities.slice(0, 20).map((a) => {
          const team = getTeam(a.teamId)
          if (!team) return null
          return (
            <div key={a.id} className="flex items-center gap-2 text-xs py-1"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT[a.reason] }} />
              <span className="font-semibold flex-shrink-0" style={{ color: team.color }}>{team.name}</span>
              <span className="text-[#9BA8C4] capitalize">{a.reason}</span>
              <span className={`ml-auto font-bold flex-shrink-0 ${a.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {a.points >= 0 ? '+' : ''}{a.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
