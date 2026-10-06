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
  const allTopics = useGameStore((s) => s.getAllTopics())
  const getTopicLabel = (tag?: string) => {
    if (!tag) return null
    return allTopics.find((t) => t.tag === tag) ?? { tag, label: tag, emoji: '🏷️' }
  }

  const [showAddRound, setShowAddRound] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [tab, setTab] = useState<'rounds' | 'leaderboard'>('rounds')

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-xl mb-4">Session not found.</p>
          <Link href="/game" className="text-primary underline">← Back to sessions</Link>
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
    all: 'text-primary',
    easy: 'text-success',
    medium: 'text-primary',
    hard: 'text-danger',
  }

  return (
    <div className="flex flex-col h-full">
      {showAddRound && <AddRoundModal sessionId={sessionId} onClose={() => setShowAddRound(false)} />}
      {showTeams && <TeamManager sessionId={sessionId} onClose={() => setShowTeams(false)} />}

      {/* Page header */}
      <div
        className="border-b px-5 py-3 flex items-center gap-4 shrink-0"
        style={{ borderColor: 'color-mix(in oklab, var(--primary) 18%, transparent)', background: 'linear-gradient(135deg,var(--card),var(--sidebar))' }}
      >
        <Link href="/game" className="text-muted-foreground hover:text-primary text-lg transition-colors">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl tracking-widest text-gold-glow truncate">{session.name}</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
            {session.status === 'active' ? '● Live Session' : session.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTeams(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)', color: 'var(--secondary)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--secondary) 35%, transparent)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--secondary) 20%, transparent)')}
          >
            👥 Teams
          </button>
          <button
            onClick={() => setShowAddRound(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 28%, transparent)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 15%, transparent)')}
          >
            + Round
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto">
        {/* Tab bar */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'color-mix(in oklab, var(--foreground) 5%, transparent)' }}>
          {(['rounds', 'leaderboard'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-all"
              style={
                tab === t
                  ? { background: 'var(--card)', color: 'var(--primary)', border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)' }
                  : { background: 'transparent', color: 'var(--muted-foreground)' }
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
                style={{ background: 'color-mix(in oklab, var(--danger-solid) 12%, transparent)', border: '1.5px solid color-mix(in oklab, var(--danger-solid) 45%, transparent)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 20%, transparent)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 12%, transparent)')}
              >
                <span className="text-2xl shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-danger">No teams added yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Rounds cannot start without at least one team. Tap to add teams.</p>
                </div>
                <span className="text-xs font-semibold text-secondary shrink-0 px-3 py-1.5 rounded-lg"
                  style={{ background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)' }}>
                  👥 Add Teams
                </span>
              </button>
            )}
            {rounds.length === 0 && (
              <div className="text-center py-14 text-muted-foreground">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-semibold mb-1 text-foreground">No rounds yet</p>
                <p className="text-sm mb-5">Add a round to start the game.</p>
                <button
                  onClick={() => setShowAddRound(true)}
                  className="px-6 py-2.5 rounded-lg font-display text-lg tracking-wider"
                  style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
                >
                  ADD FIRST ROUND
                </button>
              </div>
            )}

            {rounds.map((round) => (
              <div
                key={round.id}
                className="panel animate-slide-up"
                style={{ borderColor: round.status === 'active' ? 'color-mix(in oklab, var(--success-solid) 50%, transparent)' : undefined }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{getCatIcon(round.categoryId)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{round.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusPill[round.status]}`}>
                        {statusLabel[round.status]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>{getCatName(round.categoryId)}</span>
                      <span className={`capitalize font-semibold ${diffColor[round.difficulty]}`}>
                        {round.difficulty === 'all' ? '⭐ All difficulties' : round.difficulty}
                      </span>
                      {round.topicTag && (() => {
                        const t = getTopicLabel(round.topicTag)
                        return t ? (
                          <span className="font-semibold" style={{ color: 'var(--secondary)' }}>
                            {t.emoji} {t.label}
                          </span>
                        ) : null
                      })()}
                      {round.questionLimit && <span>Limit: {round.questionLimit}q</span>}
                      {round.status !== 'pending' && (
                        <span>Q {round.questionIndex + 1}/{round.questionQueue.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    {round.status === 'pending' && (
                      <div className="relative group/start">
                        <button
                          onClick={() => handleStartRound(round.id)}
                          disabled={teamCount === 0}
                          className="px-4 py-2 rounded-lg font-display text-base tracking-wider transition-all disabled:cursor-not-allowed"
                          style={teamCount === 0
                            ? { background: 'color-mix(in oklab, var(--foreground) 8%, transparent)', color: 'color-mix(in oklab, var(--foreground) 25%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 10%, transparent)' }
                            : { background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }
                          }
                          onMouseOver={(e) => { if (teamCount > 0) e.currentTarget.style.opacity = '0.88' }}
                          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                        >
                          START
                        </button>
                        {teamCount === 0 && (
                          <div
                            className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/start:opacity-100 transition-opacity z-10"
                            style={{ background: 'var(--surface)', border: '1px solid color-mix(in oklab, var(--danger-solid) 50%, transparent)', color: 'var(--danger)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                          >
                            ⚠ Add at least 1 team first
                            <div className="absolute top-full right-4 w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--surface)' }} />
                          </div>
                        )}
                      </div>
                    )}
                    {round.status === 'active' && (
                      <button
                        onClick={() => handleResumeRound(round.id)}
                        className="px-4 py-2 rounded-lg font-display text-base tracking-wider"
                        style={{ background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)', border: '1.5px solid var(--success-solid)', color: 'var(--success)' }}
                      >
                        RESUME
                      </button>
                    )}
                    {round.status === 'completed' && (
                      <span className="px-3 py-2 text-xs font-bold text-primary">✓ DONE</span>
                    )}
                    {round.status !== 'active' && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete round "${round.name}"?`)) deleteRound(round.id)
                        }}
                        className="text-muted-foreground hover:text-red-400 text-xl px-1 transition-colors"
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