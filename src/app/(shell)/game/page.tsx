'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'

export default function GameHomePage() {
  const router = useRouter()
  const { sessions, createSession, deleteSession, setActiveSession } = useGameStore()
  const [name, setName] = useState('')

  const sessionList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt)

  const handleCreate = () => {
    const n = name.trim() || `Session ${sessionList.length + 1}`
    const id = createSession(n)
    setName('')
    router.push(`/session/${id}`)
  }

  const handleOpen = (id: string) => {
    setActiveSession(id)
    router.push(`/session/${id}`)
  }

  const statusColor: Record<string, string> = {
    setup: 'text-[#9BA8C4]',
    active: 'text-[#6DFFAA]',
    ended: 'text-[#F5C842]',
  }
  const statusLabel: Record<string, string> = {
    setup: 'Setup',
    active: '● Live',
    ended: 'Ended',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div
        className="border-b px-6 py-4 flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.18)', background: 'linear-gradient(135deg,#142240,#0D1E38)' }}
      >
        <h1 className="font-display text-2xl tracking-widest text-gold-glow">SESSIONS</h1>
        <p className="text-[#9BA8C4] text-xs tracking-wide mt-0.5">
          {sessionList.length} session{sessionList.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl w-full mx-auto">
        {/* Create new */}
        <div className="panel mb-6">
          <h2 className="font-display text-lg tracking-widest text-[#F5C842] mb-3">NEW SESSION</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Youth Night – Week 3"
              className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(245,200,66,0.25)',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
            />
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 rounded-lg font-display text-lg tracking-wider transition-all"
              style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              CREATE
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {sessionList.length === 0 ? (
          <div className="text-center py-16 text-[#9BA8C4]">
            <div className="text-5xl mb-4">✝️</div>
            <p className="text-lg font-semibold mb-1 text-[#F0EDD8]">No sessions yet</p>
            <p className="text-sm">Create your first session above to get started.</p>
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
                  onClick={() => handleOpen(s.id)}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.45)')}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor =
                      s.status === 'active' ? 'rgba(26,138,74,0.5)' : 'rgba(245,200,66,0.18)')
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#F0EDD8] truncate">{s.name}</div>
                    <div className="text-xs text-[#9BA8C4] mt-0.5">
                      {new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${s.name}"? This cannot be undone.`)) deleteSession(s.id)
                    }}
                    className="text-[#9BA8C4] hover:text-red-400 text-xl px-1 transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
