'use client'

import { useState } from 'react'
import { useImageGameStore } from '@/store/imageGameStore'

interface Props { sessionId: string }

export function ParticipantManager({ sessionId }: Props) {
  const { sessions, addParticipant, removeParticipant, updateParticipant, reorderParticipants } = useImageGameStore()
  const session = sessions[sessionId]
  if (!session) return null

  const isTeam = session.participantMode === 'team'
  const [name, setName] = useState('')
  const [members, setMembers] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editMembers, setEditMembers] = useState('')
  const [memberInput, setMemberInput] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleAdd = () => {
    const n = name.trim(); if (!n) return
    const m = isTeam ? members.split(',').map(s => s.trim()).filter(Boolean) : []
    addParticipant(sessionId, n, m)
    setName(''); setMembers('')
  }

  const handleSaveEdit = (id: string) => {
    const n = editName.trim(); if (!n) return
    const m = isTeam ? editMembers.split(',').map(s => s.trim()).filter(Boolean) : undefined
    updateParticipant(sessionId, id, { name: n, ...(isTeam ? { members: m } : {}) })
    setEditingId(null)
  }

  const handleDragStart = (i: number) => setDragging(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i) }
  const handleDrop = (toIndex: number) => {
    if (dragging !== null && dragging !== toIndex) reorderParticipants(sessionId, dragging, toIndex)
    setDragging(null); setDragOver(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="panel">
        <h3 className="font-display text-lg tracking-widest text-primary mb-3">
          ADD {isTeam ? 'TEAM' : 'PARTICIPANT'}
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTeam && handleAdd()}
            placeholder={isTeam ? 'Team name…' : 'Participant name…'}
            maxLength={32}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
            style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)', fontFamily: 'var(--font-body)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
          />
          {!isTeam && (
            <button onClick={handleAdd}
              className="px-4 py-2.5 rounded-lg font-bold text-lg"
              style={{ background: 'var(--primary)', color: 'var(--background)' }}>+</button>
          )}
        </div>
        {isTeam && (
          <>
            <input
              type="text" value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="Members (comma-separated, optional)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden mb-3"
              style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
            />
            <button onClick={handleAdd}
              className="w-full py-2.5 rounded-lg font-display text-lg tracking-wider"
              style={{ background: 'var(--primary)', color: 'var(--background)' }}>
              ADD TEAM
            </button>
          </>
        )}
      </div>

      {/* Participant list */}
      {session.participants.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-4xl mb-3">{isTeam ? '👥' : '👤'}</div>
          <p className="font-semibold text-foreground mb-1">No {isTeam ? 'teams' : 'participants'} yet</p>
          <p className="text-sm">Add {isTeam ? 'a team' : 'a participant'} above to get started.</p>
        </div>
      ) : (
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2 flex items-center gap-2">
            <span>{session.participants.length} {isTeam ? 'teams' : 'participants'}</span>
            <span className="text-subtle">· drag to reorder queue</span>
          </div>
          <div className="flex flex-col gap-2">
            {session.participants.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                className="rounded-xl p-3 transition-all"
                style={{
                  background: dragOver === i ? 'color-mix(in oklab, var(--primary) 8%, transparent)' : 'color-mix(in oklab, var(--foreground) 4%, transparent)',
                  border: dragOver === i
                    ? '1.5px solid color-mix(in oklab, var(--primary) 40%, transparent)'
                    : '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)',
                  cursor: 'grab',
                  opacity: dragging === i ? 0.45 : 1,
                }}
              >
                {editingId === p.id ? (
                  <div className="flex flex-col gap-2">
                    <input autoFocus value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(p.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-sm text-foreground outline-hidden"
                      style={{ background: 'color-mix(in oklab, var(--foreground) 8%, transparent)', border: '1px solid var(--primary)', fontFamily: 'var(--font-body)' }} />
                    {isTeam && (
                      <input value={editMembers}
                        onChange={(e) => setEditMembers(e.target.value)}
                        placeholder="Members (comma-separated)"
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-foreground outline-hidden"
                        style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)', fontFamily: 'var(--font-body)' }} />
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(p.id)}
                        className="px-3 py-1 rounded-sm text-xs font-bold text-success"
                        style={{ background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)' }}>✓ Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-sm text-xs text-muted-foreground"
                        style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <span className="text-subtle text-base select-none shrink-0">⠿</span>
                    {/* Queue position */}
                    <span className="font-display text-lg min-w-[24px] text-center"
                      style={{ color: i === 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>{i + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{p.name}</div>
                      {p.members && p.members.length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {p.members.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-display text-lg text-primary">{p.score}</span>
                      <span className="text-[9px] text-muted-foreground">pts</span>
                      <button onClick={() => { setEditingId(p.id); setEditName(p.name); setEditMembers(p.members?.join(', ') ?? '') }}
                        className="text-muted-foreground hover:text-primary text-xs font-semibold transition-colors px-1.5 py-0.5 rounded-sm"
                        style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)' }}>✎</button>
                      <button onClick={() => { if (confirm(`Remove "${p.name}"?`)) removeParticipant(sessionId, p.id) }}
                        className="text-muted-foreground hover:text-red-400 text-lg transition-colors">×</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-subtle mt-3 text-center">
            Queue order determines who answers first. Rotates automatically after each image.
          </p>
        </div>
      )}
    </div>
  )
}
