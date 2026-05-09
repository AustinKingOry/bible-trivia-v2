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
        <h3 className="font-display text-lg tracking-widest text-[#F5C842] mb-3">
          ADD {isTeam ? 'TEAM' : 'PARTICIPANT'}
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTeam && handleAdd()}
            placeholder={isTeam ? 'Team name…' : 'Participant name…'}
            maxLength={32}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
            onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
          />
          {!isTeam && (
            <button onClick={handleAdd}
              className="px-4 py-2.5 rounded-lg font-bold text-lg"
              style={{ background: '#F5C842', color: '#0A1628' }}>+</button>
          )}
        </div>
        {isTeam && (
          <>
            <input
              type="text" value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="Members (comma-separated, optional)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
            />
            <button onClick={handleAdd}
              className="w-full py-2.5 rounded-lg font-display text-lg tracking-wider"
              style={{ background: '#F5C842', color: '#0A1628' }}>
              ADD TEAM
            </button>
          </>
        )}
      </div>

      {/* Participant list */}
      {session.participants.length === 0 ? (
        <div className="text-center py-10 text-[#9BA8C4]">
          <div className="text-4xl mb-3">{isTeam ? '👥' : '👤'}</div>
          <p className="font-semibold text-[#F0EDD8] mb-1">No {isTeam ? 'teams' : 'participants'} yet</p>
          <p className="text-sm">Add {isTeam ? 'a team' : 'a participant'} above to get started.</p>
        </div>
      ) : (
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2 flex items-center gap-2">
            <span>{session.participants.length} {isTeam ? 'teams' : 'participants'}</span>
            <span className="text-[#4A5568]">· drag to reorder queue</span>
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
                  background: dragOver === i ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.04)',
                  border: dragOver === i
                    ? '1.5px solid rgba(245,200,66,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'grab',
                  opacity: dragging === i ? 0.45 : 1,
                }}
              >
                {editingId === p.id ? (
                  <div className="flex flex-col gap-2">
                    <input autoFocus value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(p.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #F5C842', fontFamily: 'var(--font-body)' }} />
                    {isTeam && (
                      <input value={editMembers}
                        onChange={(e) => setEditMembers(e.target.value)}
                        placeholder="Members (comma-separated)"
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-[#F0EDD8] outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.3)', fontFamily: 'var(--font-body)' }} />
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(p.id)}
                        className="px-3 py-1 rounded text-xs font-bold text-[#6DFFAA]"
                        style={{ background: 'rgba(26,138,74,0.2)' }}>✓ Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded text-xs text-[#9BA8C4]"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <span className="text-[#4A5568] text-base select-none flex-shrink-0">⠿</span>
                    {/* Queue position */}
                    <span className="font-display text-lg min-w-[24px] text-center"
                      style={{ color: i === 0 ? '#F5C842' : '#9BA8C4' }}>{i + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#F0EDD8] truncate">{p.name}</div>
                      {p.members && p.members.length > 0 && (
                        <div className="text-[10px] text-[#9BA8C4] mt-0.5 truncate">
                          {p.members.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-display text-lg text-[#F5C842]">{p.score}</span>
                      <span className="text-[9px] text-[#9BA8C4]">pts</span>
                      <button onClick={() => { setEditingId(p.id); setEditName(p.name); setEditMembers(p.members?.join(', ') ?? '') }}
                        className="text-[#9BA8C4] hover:text-[#F5C842] text-xs font-semibold transition-colors px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>✎</button>
                      <button onClick={() => { if (confirm(`Remove "${p.name}"?`)) removeParticipant(sessionId, p.id) }}
                        className="text-[#9BA8C4] hover:text-red-400 text-lg transition-colors">×</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#4A5568] mt-3 text-center">
            Queue order determines who answers first. Rotates automatically after each image.
          </p>
        </div>
      )}
    </div>
  )
}
