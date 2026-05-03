'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES, ALL_TOPICS_TAG } from '@/lib/data'
import type { Difficulty } from '@/types'

const DIFFS: { id: Difficulty; label: string; color: string }[] = [
  { id: 'all',    label: '⭐ All',    color: '#F5C842' },
  { id: 'easy',   label: '🟢 Easy',   color: '#6DFFAA' },
  { id: 'medium', label: '🟡 Medium', color: '#F5C842' },
  { id: 'hard',   label: '🔴 Hard',   color: '#FF8A80' },
]

interface Props { sessionId: string; onClose: () => void }

export function AddRoundModal({ sessionId, onClose }: Props) {
  const { createRound, getAvailableQuestionCount, getSessionRounds, getAllTopics } = useGameStore()
  const existingRounds = getSessionRounds(sessionId)
  const allTopics = getAllTopics()

  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id)
  const [difficulty, setDifficulty]   = useState<Difficulty>('all')
  const [topicTag, setTopicTag]       = useState<string>(ALL_TOPICS_TAG)
  const [questionLimit, setQuestionLimit] = useState('')
  const [name, setName] = useState('')

  const available = getAvailableQuestionCount(categoryId, difficulty, topicTag)
  const cat = CATEGORIES.find((c) => c.id === categoryId)!

  const topicLabel = topicTag === ALL_TOPICS_TAG
    ? 'All topics'
    : allTopics.find((t) => t.tag === topicTag)?.label ?? topicTag

  const defaultName = `Round ${existingRounds.length + 1} — ${cat.name}${topicTag !== ALL_TOPICS_TAG ? ` (${topicLabel})` : ''}`

  const handleCreate = () => {
    const roundName = name.trim() || defaultName
    const limit = questionLimit ? parseInt(questionLimit) : undefined
    createRound(sessionId, {
      name: roundName,
      categoryId,
      topicTag: topicTag === ALL_TOPICS_TAG ? undefined : topicTag,
      difficulty,
      questionLimit: limit,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="panel w-full max-w-lg animate-slide-up overflow-y-auto"
        style={{ border: '1.5px solid rgba(245,200,66,0.35)', maxHeight: '90vh' }}
      >
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
            placeholder={defaultName}
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

        {/* Question format */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">Question Format</div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="text-left p-2.5 rounded-lg transition-all"
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

        {/* Topic / Subject filter */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">
            Subject / Topic
            <span className="ml-2 text-[#4A5568] normal-case font-normal">optional filter</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* All topics option */}
            <button
              onClick={() => setTopicTag(ALL_TOPICS_TAG)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={topicTag === ALL_TOPICS_TAG
                ? { background: 'rgba(245,200,66,0.15)', border: '1.5px solid #F5C842', color: '#F5C842' }
                : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
              }
            >
              🌐 All topics
            </button>
            {allTopics.map((t) => (
              <button
                key={t.tag}
                onClick={() => setTopicTag(t.tag)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={topicTag === t.tag
                  ? { background: 'rgba(123,47,190,0.2)', border: '1.5px solid #7B2FBE', color: '#C084FC' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
                }
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
          {topicTag !== ALL_TOPICS_TAG && (
            <p className="text-[10px] text-[#9BA8C4] mt-1.5">
              Only <span className="text-[#C084FC] font-semibold">{topicLabel}</span> questions will be used in this round.
            </p>
          )}
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase">Difficulty</div>
            {difficulty === 'all' && (
              <span className="text-[10px] text-[#F5C842]">All difficulties shuffled together</span>
            )}
          </div>
          <div className="flex gap-2">
            {DIFFS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                style={difficulty === d.id
                  ? { background: `${d.color}18`, border: `1.5px solid ${d.color}`, color: d.color }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#9BA8C4] mt-1.5">
            {available} question{available !== 1 ? 's' : ''} available
            {difficulty === 'all' ? ' across all difficulties' : ''}
            {topicTag !== ALL_TOPICS_TAG ? ` · ${topicLabel} only` : ''}
          </p>
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
          <p className="text-center text-xs text-red-400 mt-2">
            No questions for this selection.
            {topicTag !== ALL_TOPICS_TAG && ' Try "All topics" or add questions with this topic.'}
          </p>
        )}
      </div>
    </div>
  )
}
