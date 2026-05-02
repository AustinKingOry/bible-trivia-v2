'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { pushSingleQuestion, deleteSingleQuestion } from '@/lib/sync'
import { useAuth } from '@/hooks/useAuth'
import type { Category, Question } from '@/types'

interface Props {
  questions: Question[]
  category: Category
  onEdit: (q: Question) => void
  onAdd: () => void
}

const DIFF_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#6DFFAA', bg: 'rgba(26,138,74,0.15)',   border: 'rgba(26,138,74,0.4)'   },
  medium: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)',  border: 'rgba(245,200,66,0.4)'  },
  hard:   { color: '#FF8A80', bg: 'rgba(192,57,43,0.15)',   border: 'rgba(192,57,43,0.4)'   },
}

export function QuestionList({ questions, category, onEdit, onAdd }: Props) {
  const { deleteQuestion, updateQuestion } = useGameStore()
  const { user } = useAuth()
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const handleSyncQuestion = async (q: any) => {
    if (!user) return
    setSyncingId(q.id)
    const { ok, error } = await pushSingleQuestion(q, user.id)
    if (ok) updateQuestion(q.id, { synced: true })
    else console.error('Sync failed:', error)
    setSyncingId(null)
  }

  const handleDeleteQuestion = async (q: any) => {
    if (!confirm('Delete this question?')) return
    deleteQuestion(q.id)
    if (q.synced) await deleteSingleQuestion(q.id)
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="text-5xl mb-4">{category.icon}</div>
        <p className="text-[#F0EDD8] font-semibold text-lg mb-1">No questions here yet</p>
        <p className="text-[#9BA8C4] text-sm mb-6 max-w-xs">{category.addHint}</p>
        <button
          onClick={onAdd}
          className="px-6 py-3 rounded-lg font-display text-lg tracking-wider"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
        >
          ADD FIRST QUESTION
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex flex-col gap-2">
        {questions.map((q) => {
          const ds = DIFF_STYLE[q.difficulty]
          const isCustom = q.source !== 'seed'
          return (
            <div
              key={q.id}
              className="group flex items-start gap-4 px-4 py-3.5 rounded-lg transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(245,200,66,0.1)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.1)')}
            >
              {/* Difficulty pill */}
              <span
                className="mt-0.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}
              >
                {q.difficulty}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F0EDD8] font-medium leading-snug mb-1">{q.question}</p>
                <p className="text-xs text-[#9BA8C4] leading-snug">
                  <span className="text-[#6DFFAA] font-semibold">A: </span>
                  {q.answer}
                </p>

                {/* Category-specific details */}
                {q.quoteFields && (
                  <p className="text-[10px] text-[#9BA8C4] mt-1">📖 {q.quoteFields.verseRef}</p>
                )}
                {q.openVerseFields && (
                  <p className="text-[10px] text-[#9BA8C4] mt-1">
                    📜 {q.openVerseFields.book} {q.openVerseFields.chapter}:{q.openVerseFields.verse}
                  </p>
                )}
                {q.trueFalseFields && (
                  <span
                    className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded"
                    style={
                      q.trueFalseFields.isTrue
                        ? { background: 'rgba(26,138,74,0.2)', color: '#6DFFAA' }
                        : { background: 'rgba(192,57,43,0.2)', color: '#FF8A80' }
                    }
                  >
                    {q.trueFalseFields.isTrue ? 'TRUE' : 'FALSE'}
                  </span>
                )}
                {q.hotSeatFields && (
                  <p className="text-[10px] text-[#9BA8C4] mt-1">
                    {q.hotSeatFields.acceptableAnswers.length} acceptable answers
                  </p>
                )}
              </div>

              {/* Source badge + actions */}
              <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {isCustom && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(26,138,74,0.2)', color: '#6DFFAA', border: '1px solid rgba(26,138,74,0.3)' }}
                  >
                    CUSTOM
                  </span>
                )}
                {q.source === 'ai' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(123,47,190,0.2)', color: '#C084FC', border: '1px solid rgba(123,47,190,0.3)' }}
                  >
                    AI
                  </span>
                )}
                {isCustom && (
                  <>
                    {/* Sync status dot — only shown when logged in */}
                    {q.synced === false && user && (
                      <button
                        onClick={() => handleSyncQuestion(q)}
                        disabled={syncingId === q.id}
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all disabled:opacity-50"
                        style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.3)' }}
                        title="Not synced — click to push"
                      >
                        {syncingId === q.id ? '…' : '↑'}
                      </button>
                    )}
                    {q.synced === false && !user && (
                      <span className="text-[9px] text-[#4A5568]" title="Sign in to sync">⚬</span>
                    )}
                    {q.synced === true && (
                      <span className="text-[9px] text-[#6DFFAA]" title="Synced">✓</span>
                    )}
                    <button
                      onClick={() => onEdit(q)}
                      className="text-[#9BA8C4] hover:text-[#F5C842] text-xs font-semibold transition-colors px-2 py-1 rounded"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q)}
                      className="text-[#9BA8C4] hover:text-red-400 text-lg transition-colors leading-none px-1"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
