'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useImageGameStore } from '@/store/imageGameStore'
import { ParticipantManager } from '@/components/image-game/ParticipantManager'
import { AddRoundModal } from '@/components/image-game/AddRoundModal'
import { ImageQuestionManager } from '@/components/image-game/ImageQuestionManager'
import { showToast } from '@/components/shared/Toast'

export default function ImageSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { sessions, startRound, endRound, deleteRound } = useImageGameStore()
  const session = sessions[sessionId]

  const [tab, setTab] = useState<'rounds' | 'participants' | 'questions'>('rounds')
  const [showAddRound, setShowAddRound] = useState(false)

  if (!session) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <p className="text-xl mb-3">Session not found.</p>
        <Link href="/image-game" className="text-primary underline">← Back</Link>
      </div>
    </div>
  )

  const handleStart = (roundId: string) => {
    if (session.participants.length === 0) {
      showToast('Add at least 1 participant before starting', 'error')
      setTab('participants')
      return
    }
    const qs = useImageGameStore.getState().getAvailableCount(
      session.rounds.find(r => r.id === roundId)?.topicTag,
      session.rounds.find(r => r.id === roundId)?.difficulty
    )
    if (qs === 0) {
      showToast('No images available for this round\'s filters — add image questions first', 'error')
      setTab('questions')
      return
    }
    startRound(sessionId, roundId)
    router.push(`/image-game/session/${sessionId}/play/${roundId}`)
  }

  const statusPill: Record<string, string> = {
    pending: 'pill-pending', active: 'pill-active', completed: 'pill-completed',
  }
  const statusLabel: Record<string, string> = {
    pending: 'Pending', active: '● Active', completed: '✓ Done',
  }
  const diffColor: Record<string, string> = {
    all: 'text-primary', easy: 'text-success', medium: 'text-primary', hard: 'text-danger',
  }

  const leaderboard = useImageGameStore.getState().getLeaderboard(sessionId)

  return (
    <div className="flex flex-col h-full">
      {showAddRound && (
        <AddRoundModal sessionId={sessionId} onClose={() => setShowAddRound(false)} />
      )}

      {/* Header */}
      <div className="border-b px-5 py-3 flex items-center gap-4 shrink-0"
        style={{ borderColor: 'color-mix(in oklab, var(--primary) 18%, transparent)', background: 'linear-gradient(135deg,var(--card),var(--sidebar))' }}>
        <Link href="/image-game" className="text-muted-foreground hover:text-primary text-lg transition-colors">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl tracking-widest text-gold-glow truncate">{session.name}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {session.participantMode === 'team' ? '👥 Teams' : '👤 Individuals'} ·{' '}
            {session.participants.length} registered
          </p>
        </div>
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

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'color-mix(in oklab, var(--foreground) 5%, transparent)' }}>
          {([
            { id: 'rounds',       label: '🎮 Rounds' },
            { id: 'participants', label: session.participantMode === 'team' ? '👥 Teams' : '👤 Participants' },
            { id: 'questions',    label: '🖼️ Images' },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
              style={tab === t.id
                ? { background: 'var(--card)', color: 'var(--primary)', border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)' }
                : { background: 'transparent', color: 'var(--muted-foreground)' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {/* Rounds tab */}
        {tab === 'rounds' && (
          <div className="flex flex-col gap-3">
            {/* No-participant warning */}
            {session.participants.length === 0 && (
              <button onClick={() => setTab('participants')}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left w-full transition-all"
                style={{ background: 'color-mix(in oklab, var(--danger-solid) 12%, transparent)', border: '1.5px solid color-mix(in oklab, var(--danger-solid) 45%, transparent)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 20%, transparent)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--danger-solid) 12%, transparent)')}>
                <span className="text-2xl shrink-0">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-danger">
                    No {session.participantMode === 'team' ? 'teams' : 'participants'} added
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add at least one before starting a round.</p>
                </div>
                <span className="text-xs font-semibold text-secondary px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)' }}>
                  {session.participantMode === 'team' ? '👥 Add Teams' : '👤 Add Participants'}
                </span>
              </button>
            )}

            {session.rounds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="font-semibold text-foreground mb-1">No rounds yet</p>
                <p className="text-sm mb-5">Create a round to start the image game.</p>
                <button onClick={() => setShowAddRound(true)}
                  className="px-6 py-2.5 rounded-lg font-display text-lg tracking-wider"
                  style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}>
                  ADD FIRST ROUND
                </button>
              </div>
            ) : (
              session.rounds.map((round) => (
                <div key={round.id} className="panel animate-slide-up"
                  style={{ borderColor: round.status === 'active' ? 'color-mix(in oklab, var(--success-solid) 50%, transparent)' : undefined }}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">🖼️</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{round.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusPill[round.status]}`}>
                          {statusLabel[round.status]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                        {round.topicTag && (
                          <span className="font-semibold" style={{ color: 'var(--secondary)' }}>🏷️ {round.topicTag}</span>
                        )}
                        <span className={`capitalize font-semibold ${diffColor[round.difficulty ?? 'all']}`}>
                          {round.difficulty === 'all' || !round.difficulty ? '⭐ All difficulties' : round.difficulty}
                        </span>
                        <span>⏱ {round.answerTimeSecs}s · +{round.pointsCorrect}pts</span>
                        {round.status !== 'pending' && (
                          <span>Q {round.questionIndex + 1}/{round.questionQueue.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {round.status === 'pending' && (
                        <button onClick={() => handleStart(round.id)}
                          className="px-4 py-2 rounded-lg font-display text-base tracking-wider transition-all"
                          style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
                          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
                          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}>
                          START
                        </button>
                      )}
                      {round.status === 'active' && (
                        <button onClick={() => router.push(`/image-game/session/${sessionId}/play/${round.id}`)}
                          className="px-4 py-2 rounded-lg font-display text-base tracking-wider"
                          style={{ background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)', border: '1.5px solid var(--success-solid)', color: 'var(--success)' }}>
                          RESUME
                        </button>
                      )}
                      {round.status === 'completed' && (
                        <span className="px-3 py-2 text-xs font-bold text-primary">✓ DONE</span>
                      )}
                      {round.status !== 'active' && (
                        <button onClick={() => { if (confirm(`Delete round "${round.name}"?`)) deleteRound(sessionId, round.id) }}
                          className="text-muted-foreground hover:text-red-400 text-xl px-1 transition-colors">×</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Leaderboard summary if any activity */}
            {session.activities.length > 0 && (
              <div className="panel mt-2">
                <h3 className="font-display text-base tracking-widest text-primary mb-3">STANDINGS</h3>
                {leaderboard.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid color-mix(in oklab, var(--foreground) 5%, transparent)' }}>
                    <span className="font-display text-lg min-w-[24px] text-center"
                      style={{ color: i === 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>{i + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 text-sm font-semibold text-foreground">{p.name}</span>
                    <span className="font-display text-2xl text-primary">{p.score}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'participants' && (
          <ParticipantManager sessionId={sessionId} />
        )}

        {tab === 'questions' && (
          <ImageQuestionManager />
        )}
      </div>
    </div>
  )
}
