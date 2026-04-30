'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES } from '@/lib/data'
import type { Difficulty } from '@/types'

const DIFFS: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy',   label: '🟢 Easy',   color: '#6DFFAA' },
  { id: 'medium', label: '🟡 Medium', color: '#F5C842' },
  { id: 'hard',   label: '🔴 Hard',   color: '#FF8A80' },
]

interface Props { sessionId: string; onClose: () => void }

export function AddRoundModal({ sessionId, onClose }: Props) {
  const { createRound, getAvailableQuestionCount, getSessionRounds } = useGameStore()
  const existingRounds = getSessionRounds(sessionId)

  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [questionLimit, setQuestionLimit] = useState('')
  const [name, setName] = useState('')

  const available = getAvailableQuestionCount(categoryId, difficulty)
  const cat = CATEGORIES.find((c) => c.id === categoryId)!

  const handleCreate = () => {
    const roundName = name.trim() || `Round ${existingRounds.length + 1} — ${cat.name}`
    const limit = questionLimit ? parseInt(questionLimit) : undefined
    createRound(sessionId, { name: roundName, categoryId, difficulty, questionLimit: limit })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="panel w-full max-w-md animate-slide-up" style={{ border: '1.5px solid rgba(245,200,66,0.35)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-widest text-[#F5C842]">ADD ROUND</h2>
          <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Round name */}
        <label className="block mb-4">
          <span className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
            Round Name (optional)
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Round ${existingRounds.length + 1} — ${cat.name}`}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(245,200,66,0.25)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
          />
        </label>

        {/* Category */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">Category</div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="text-left p-2.5 rounded-lg transition-all text-sm"
                style={categoryId === c.id
                  ? { background: 'rgba(245,200,66,0.12)', border: '1.5px solid #F5C842' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent' }
                }
              >
                <span className="mr-1.5">{c.icon}</span>
                <span className="font-medium text-[#F0EDD8] text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">Difficulty</div>
          <div className="flex gap-2">
            {DIFFS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={difficulty === d.id
                  ? { background: 'rgba(245,200,66,0.12)', border: `1.5px solid ${d.color}`, color: d.color }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#9BA8C4] mt-1.5">{available} question{available !== 1 ? 's' : ''} available</p>
        </div>

        {/* Question limit */}
        <label className="block mb-6">
          <span className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
            Question Limit (optional — leave blank to use all)
          </span>
          <input
            type="number"
            min="1"
            max={available}
            value={questionLimit}
            onChange={(e) => setQuestionLimit(e.target.value)}
            placeholder={`Max ${available}`}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(245,200,66,0.25)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
          />
        </label>

        <button
          onClick={handleCreate}
          disabled={available === 0}
          className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
          onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          CREATE ROUND
        </button>
        {available === 0 && (
          <p className="text-center text-xs text-red-400 mt-2">No questions for this selection.</p>
        )}
      </div>
    </div>
  )
}
