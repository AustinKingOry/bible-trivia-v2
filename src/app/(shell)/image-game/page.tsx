'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useImageGameStore } from '@/store/imageGameStore'
import type { ParticipantType } from '@/types/imageGame'

export default function ImageGameHomePage() {
  const router = useRouter()
  const { sessions, createSession, deleteSession } = useImageGameStore()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<ParticipantType>('individual')

  const sessionList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt)

  const handleCreate = () => {
    const n = name.trim() || `Image Game ${sessionList.length + 1}`
    const id = createSession(n, mode)
    setName('')
    router.push(`/image-game/session/${id}`)
  }

  const statusColor: Record<string, string> = {
    setup: 'text-[#9BA8C4]', active: 'text-[#6DFFAA]', ended: 'text-[#F5C842]',
  }
  const statusLabel: Record<string, string> = {
    setup: 'Setup', active: '● Live', ended: 'Ended',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.18)', background: 'linear-gradient(135deg,#142240,#0D1E38)' }}>
        <h1 className="font-display text-2xl tracking-widest text-gold-glow">IMAGE GAME</h1>
        <p className="text-[#9BA8C4] text-xs tracking-wide mt-0.5">
          Identify images — individuals or teams queue to answer
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl w-full mx-auto">
        {/* Create */}
        <div className="panel mb-6">
          <h2 className="font-display text-lg tracking-widest text-[#F5C842] mb-4">NEW SESSION</h2>

          <div className="mb-3">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
              Session Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Nature Identification Challenge"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
            />
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-2">
              Participant Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'individual', icon: '👤', label: 'Individuals', desc: 'Players join a queue one by one' },
                { id: 'team',       icon: '👥', label: 'Teams',       desc: 'Teams take turns identifying images' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="text-left p-3 rounded-lg transition-all"
                  style={mode === m.id
                    ? { background: 'rgba(245,200,66,0.12)', border: '1.5px solid #F5C842' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent' }
                  }
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="text-sm font-semibold text-[#F0EDD8]">{m.label}</div>
                  <div className="text-[10px] text-[#9BA8C4] mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-3 rounded-lg font-display text-xl tracking-widest transition-all"
            style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            CREATE SESSION
          </button>
        </div>

        {/* Sessions list */}
        {sessionList.length === 0 ? (
          <div className="text-center py-14 text-[#9BA8C4]">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="font-semibold text-[#F0EDD8] mb-1">No image game sessions yet</p>
            <p className="text-sm">Create your first session above.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-lg tracking-widest text-[#F5C842] mb-3">SESSIONS</h2>
            <div className="flex flex-col gap-2.5">
              {sessionList.map((s) => (
                <div
                  key={s.id}
                  className="panel flex items-center gap-4 cursor-pointer transition-all animate-fade-in"
                  style={{ borderColor: s.status === 'active' ? 'rgba(26,138,74,0.5)' : undefined }}
                  onClick={() => router.push(`/image-game/session/${s.id}`)}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.45)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = s.status === 'active' ? 'rgba(26,138,74,0.5)' : 'rgba(245,200,66,0.18)')}
                >
                  <div className="text-2xl">{s.participantMode === 'team' ? '👥' : '👤'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#F0EDD8] truncate">{s.name}</div>
                    <div className="text-xs text-[#9BA8C4] mt-0.5">
                      {s.participants.length} {s.participantMode === 'team' ? 'team' : 'participant'}{s.participants.length !== 1 ? 's' : ''}
                      {' · '}{s.rounds.length} round{s.rounds.length !== 1 ? 's' : ''}
                      {' · '}{new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${s.name}"?`)) deleteSession(s.id) }}
                    className="text-[#9BA8C4] hover:text-red-400 text-xl px-1 transition-colors flex-shrink-0"
                  >×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
