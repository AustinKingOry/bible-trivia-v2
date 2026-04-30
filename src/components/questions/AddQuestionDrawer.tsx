'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Category, Difficulty, Question } from '@/types'
import { QuoteForm } from './forms/QuoteForm'
import { GeneralForm } from './forms/GeneralForm'
import { CharacterForm } from './forms/CharacterForm'
import { HotSeatForm } from './forms/HotSeatForm'
import { OpenVerseForm } from './forms/OpenVerseForm'
import { TrueFalseForm } from './forms/TrueFalseForm'

interface Props {
  category: Category
  editingQuestion: Question | null
  onClose: () => void
}

const DIFF_OPTIONS: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy',   label: 'Easy',   color: '#6DFFAA' },
  { id: 'medium', label: 'Medium', color: '#F5C842' },
  { id: 'hard',   label: 'Hard',   color: '#FF8A80' },
]

export interface FormPayload {
  question: string
  answer: string
  difficulty: Difficulty
  quoteFields?: Question['quoteFields']
  openVerseFields?: Question['openVerseFields']
  trueFalseFields?: Question['trueFalseFields']
  hotSeatFields?: Question['hotSeatFields']
}

export function AddQuestionDrawer({ category, editingQuestion, onClose }: Props) {
  const { addQuestion, updateQuestion } = useGameStore()
  const isEditing = !!editingQuestion

  const [difficulty, setDifficulty] = useState<Difficulty>(editingQuestion?.difficulty ?? 'easy')
  const [payload, setPayload] = useState<Omit<FormPayload, 'difficulty'>>({
    question: editingQuestion?.question ?? '',
    answer: editingQuestion?.answer ?? '',
    quoteFields: editingQuestion?.quoteFields,
    openVerseFields: editingQuestion?.openVerseFields,
    trueFalseFields: editingQuestion?.trueFalseFields,
    hotSeatFields: editingQuestion?.hotSeatFields,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!payload.question.trim() || !payload.answer.trim()) return
    if (isEditing && editingQuestion) {
      updateQuestion(editingQuestion.id, { ...payload, difficulty })
    } else {
      addQuestion({ ...payload, difficulty, categoryId: category.id, source: 'manual' })
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const canSave = payload.question.trim().length > 0 && payload.answer.trim().length > 0

  const FORMS: Record<string, React.ReactNode> = {
    quote: <QuoteForm value={payload} onChange={setPayload} />,
    general: <GeneralForm value={payload} onChange={setPayload} />,
    character: <CharacterForm value={payload} onChange={setPayload} />,
    hotseat: <HotSeatForm value={payload} onChange={setPayload} />,
    openverse: <OpenVerseForm value={payload} onChange={setPayload} />,
    truefalse: <TrueFalseForm value={payload} onChange={setPayload} />,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        style={{ backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-lg animate-slide-up"
        style={{
          background: '#0D1E38',
          borderLeft: '1px solid rgba(245,200,66,0.25)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          animationName: 'drawerIn',
        }}
      >
        <style>{`
          @keyframes drawerIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(245,200,66,0.18)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.icon}</span>
              <h2 className="font-display text-xl tracking-widest text-[#F5C842]">
                {isEditing ? 'EDIT QUESTION' : 'ADD QUESTION'}
              </h2>
            </div>
            <p className="text-[11px] text-[#9BA8C4] mt-0.5">{category.name}</p>
          </div>
          <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Difficulty selector */}
        <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(245,200,66,0.1)' }}>
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">Difficulty</div>
          <div className="flex gap-2">
            {DIFF_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={
                  difficulty === d.id
                    ? { color: d.color, border: `1.5px solid ${d.color}`, background: `${d.color}18` }
                    : { color: '#9BA8C4', border: '1.5px solid transparent', background: 'rgba(255,255,255,0.04)' }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category-specific form */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Hint banner */}
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 text-xs text-[#9BA8C4]"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)' }}
          >
            <span className="text-base flex-shrink-0">💡</span>
            <span>{category.addHint}</span>
          </div>

          {FORMS[category.id] ?? <GeneralForm value={payload} onChange={setPayload} />}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex gap-3 flex-shrink-0"
          style={{ borderColor: 'rgba(245,200,66,0.15)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9BA8C4' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-2 px-8 py-3 rounded-lg font-display text-lg tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: saved ? '#1A8A4A' : 'linear-gradient(135deg,#F5C842,#C49A10)',
              color: '#0A1628',
              flex: 2,
            }}
          >
            {saved ? '✓ SAVED!' : isEditing ? 'SAVE CHANGES' : 'ADD QUESTION'}
          </button>
        </div>
      </div>
    </>
  )
}
