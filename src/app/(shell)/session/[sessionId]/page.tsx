'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES } from '@/lib/data'
import { AddRoundModal } from '@/components/dashboard/AddRoundModal'
import { TeamManager } from '@/components/dashboard/TeamManager'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import type { Round } from '@/types'
import { showToast } from '@/components/shared/Toast'

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()

  const session = useGameStore((s) => s.sessions[sessionId])
  const rounds = useGameStore((s) => s.getSessionRounds(sessionId))
  const teamCount = useGameStore((s) => s.getSessionTeams(sessionId).length)
  const { startRound, endRound, deleteRound } = useGameStore()

  const [showAddRound, setShowAddRound] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [tab, setTab] = useState<'rounds' | 'leaderboard'>('rounds')

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-[#9BA8C4]">
        <div className="text-center">
          <p className="text-xl mb-4">Session not found.</p>
          <Link href="/game" className="text-[#F5C842] underline">← Back to sessions</Link>
        </div>
      </div>
    )
  }

  const handleStartRound = (roundId: string) => {
    if (teamCount === 0) {
      showToast('Add at least 1 team before starting a round', 'error')
      setShowTeams(true)
      return
    }
    startRound(roundId)
    router.push(`/session/${sessionId}/game/${roundId}`)
  }

  const handleResumeRound = (roundId: string) => {
    router.push(`/session/${sessionId}/game/${roundId}`)
  }

  const statusPill: Record<Round['status'], string> = {
    pending: 'pill-pending',
    active: 'pill-active',
    completed: 'pill-completed',
  }
  const statusLabel: Record<Round['status'], string> = {
    pending: 'Pending',
    active: '● Active',
    completed: '✓ Done',
  }

  const getCatIcon = (id: string) => CATEGORIES.find((c) => c.id === id)?.icon ?? ''
  const getCatName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id

  const diffColor: Record<string, string> = {
    easy: 'text-[#6DFFAA]',
    medium: 'text-[#F5C842]',
    hard: 'text-[#FF8A80]',
  }

  return (
    <div className="flex flex-col h-full">
      {showAddRound && <AddRoundModal sessionId={sessionId} onClose={() => setShowAddRound(false)} />}
      {showTeams && <TeamManager sessionId={sessionId} onClose={() => setShowTeams(false)} />}

      {/* Page header */}
      <div
        className="border-b px-5 py-3 flex items-center gap-4 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.18)', background: 'linear-gradient(135deg,#142240,#0D1E38)' }}
      >
        <Link href="/game" className="text-[#9BA8C4] hover:text-[#F5C842] text-lg transition-colors">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl tracking-widest text-gold-glow truncate">{session.name}</h1>
          <p className="text-[10px] text-[#9BA8C4] tracking-widest uppercase">
            {session.status === 'active' ? '● Live Session' : session.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTeams(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.4)', color: '#C084FC' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.35)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.2)')}
          >
            👥 Teams
          </button>
          <button
            onClick={() => setShowAddRound(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.28)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.15)')}
          >
            + Round
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto">
        {/* Tab bar */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['rounds', 'leaderboard'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-all"
              style={
                tab === t
                  ? { background: '#142240', color: '#F5C842', border: '1px solid rgba(245,200,66,0.3)' }
                  : { background: 'transparent', color: '#9BA8C4' }
              }
            >
              {t === 'rounds' ? '🎮 Rounds' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {tab === 'rounds' && (
          <div className="flex flex-col gap-3">
            {teamCount === 0 && (
              <button
                onClick={() => setShowTeams(true)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left w-full transition-all animate-slide-up"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1.5px solid rgba(192,57,43,0.45)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.2)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.12)')}
              >
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FF8A80]">No teams added yet</p>
                  <p className="text-xs text-[#9BA8C4] mt-0.5">Rounds cannot start without at least one team. Tap to add teams.</p>
                </div>
                <span className="text-xs font-semibold text-[#C084FC] flex-shrink-0 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.4)' }}>
                  👥 Add Teams
                </span>
              </button>
            )}
            {rounds.length === 0 && (
              <div className="text-center py-14 text-[#9BA8C4]">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-semibold mb-1 text-[#F0EDD8]">No rounds yet</p>
                <p className="text-sm mb-5">Add a round to start the game.</p>
                <button
                  onClick={() => setShowAddRound(true)}
                  className="px-6 py-2.5 rounded-lg font-display text-lg tracking-wider"
                  style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
                >
                  ADD FIRST ROUND
                </button>
              </div>
            )}

            {rounds.map((round) => (
              <div
                key={round.id}
                className="panel animate-slide-up"
                style={{ borderColor: round.status === 'active' ? 'rgba(26,138,74,0.5)' : undefined }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{getCatIcon(round.categoryId)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#F0EDD8]">{round.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusPill[round.status]}`}>
                        {statusLabel[round.status]}
                      </span>
                    </div>
                    <div className="text-xs text-[#9BA8C4] flex gap-3 flex-wrap">
                      <span>{getCatName(round.categoryId)}</span>
                      <span className={`capitalize font-semibold ${diffColor[round.difficulty]}`}>
                        {round.difficulty}
                      </span>
                      {round.questionLimit && <span>Limit: {round.questionLimit}q</span>}
                      {round.status !== 'pending' && (
                        <span>Q {round.questionIndex + 1}/{round.questionQueue.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    {round.status === 'pending' && (
                      <div className="relative group/start">
                        <button
                          onClick={() => handleStartRound(round.id)}
                          disabled={teamCount === 0}
                          className="px-4 py-2 rounded-lg font-display text-base tracking-wider transition-all disabled:cursor-not-allowed"
                          style={teamCount === 0
                            ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.1)' }
                            : { background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }
                          }
                          onMouseOver={(e) => { if (teamCount > 0) e.currentTarget.style.opacity = '0.88' }}
                          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                        >
                          START
                        </button>
                        {teamCount === 0 && (
                          <div
                            className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/start:opacity-100 transition-opacity z-10"
                            style={{ background: '#1E3360', border: '1px solid rgba(192,57,43,0.5)', color: '#FF8A80', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                          >
                            ⚠ Add at least 1 team first
                            <div className="absolute top-full right-4 w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1E3360' }} />
                          </div>
                        )}
                      </div>
                    )}
                    {round.status === 'active' && (
                      <button
                        onClick={() => handleResumeRound(round.id)}
                        className="px-4 py-2 rounded-lg font-display text-base tracking-wider"
                        style={{ background: 'rgba(26,138,74,0.2)', border: '1.5px solid #1A8A4A', color: '#6DFFAA' }}
                      >
                        RESUME
                      </button>
                    )}
                    {round.status === 'completed' && (
                      <span className="px-3 py-2 text-xs font-bold text-[#F5C842]">✓ DONE</span>
                    )}
                    {round.status !== 'active' && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete round "${round.name}"?`)) deleteRound(round.id)
                        }}
                        className="text-[#9BA8C4] hover:text-red-400 text-xl px-1 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && <Leaderboard sessionId={sessionId} />}
      </div>
    </div>
  )
}