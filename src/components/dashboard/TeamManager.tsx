'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

interface Props { sessionId: string; onClose: () => void }

export function TeamManager({ sessionId, onClose }: Props) {
  const { teams, addTeam, removeTeam, updateTeamName, addPlayer, removePlayer, getSessionTeams } = useGameStore()
  const sessionTeams = getSessionTeams(sessionId)

  const [teamInput, setTeamInput] = useState('')
  const [playerInputs, setPlayerInputs] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAddTeam = () => {
    const n = teamInput.trim()
    if (!n) return
    addTeam(sessionId, n)
    setTeamInput('')
  }

  const handleAddPlayer = (teamId: string) => {
    const p = (playerInputs[teamId] ?? '').trim()
    if (!p) return
    addPlayer(teamId, p)
    setPlayerInputs((prev) => ({ ...prev, [teamId]: '' }))
  }

  const handleSaveName = (teamId: string) => {
    if (editName.trim()) updateTeamName(teamId, editName.trim())
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="panel w-full sm:max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-xl"
        style={{ border: '1.5px solid rgba(123,47,190,0.4)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-widest text-[#C084FC]">MANAGE TEAMS</h2>
          <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl">×</button>
        </div>

        {/* Add team */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            placeholder="New team name..."
            maxLength={28}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(123,47,190,0.35)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#C084FC')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(123,47,190,0.35)')}
          />
          <button
            onClick={handleAddTeam}
            className="px-4 py-2.5 rounded-lg font-bold text-lg transition-all"
            style={{ background: 'rgba(123,47,190,0.3)', border: '1px solid rgba(123,47,190,0.5)', color: '#C084FC' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.5)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.3)')}
          >
            +
          </button>
        </div>

        {/* Team list */}
        {sessionTeams.length === 0 && (
          <p className="text-[#9BA8C4] text-sm text-center py-6">No teams yet. Add one above.</p>
        )}

        <div className="flex flex-col gap-3">
          {sessionTeams.map((team) => (
            <div key={team.id} className="rounded-lg p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Team header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: team.color }} />
                {editingId === team.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(team.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="flex-1 px-2 py-1 rounded text-sm text-[#F0EDD8] outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #F5C842', fontFamily: 'var(--font-body)' }}
                  />
                ) : (
                  <span className="flex-1 font-semibold text-sm">{team.name}</span>
                )}
                {editingId === team.id ? (
                  <>
                    <button onClick={() => handleSaveName(team.id)} className="text-[#6DFFAA] text-xs font-bold px-2">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-[#9BA8C4] text-xs px-1">✗</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(team.id); setEditName(team.name) }}
                      className="text-[#9BA8C4] hover:text-[#F5C842] text-xs transition-colors px-1">✎</button>
                    <button onClick={() => { if (confirm(`Remove "${team.name}"?`)) removeTeam(team.id) }}
                      className="text-[#9BA8C4] hover:text-red-400 text-lg transition-colors px-1">×</button>
                  </>
                )}
              </div>

              {/* Players */}
              <div className="pl-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {team.players.map((p) => (
                    <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {p}
                      <button onClick={() => removePlayer(team.id, p)}
                        className="text-[#9BA8C4] hover:text-red-400 ml-0.5 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={playerInputs[team.id] ?? ''}
                    onChange={(e) => setPlayerInputs((prev) => ({ ...prev, [team.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer(team.id)}
                    placeholder="Add player..."
                    maxLength={20}
                    className="flex-1 px-2.5 py-1.5 rounded text-xs text-[#F0EDD8] outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }}
                  />
                  <button onClick={() => handleAddPlayer(team.id)}
                    className="px-2.5 py-1.5 rounded text-xs font-bold transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}
                    onMouseOver={(e) => (e.currentTarget.style.color = '#F0EDD8')}
                    onMouseOut={(e) => (e.currentTarget.style.color = '#9BA8C4')}
                  >+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose}
          className="w-full mt-5 py-3 rounded-lg font-display text-lg tracking-widest transition-all"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}>
          DONE
        </button>
      </div>
    </div>
  )
}
