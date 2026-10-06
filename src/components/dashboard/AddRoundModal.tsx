'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES, ALL_TOPICS_TAG } from '@/lib/data'
import type { Difficulty } from '@/types'

const DIFFS: { id: Difficulty; label: string; color: string }[] = [
  { id: 'all',    label: '⭐ All',    color: 'var(--primary)' },
  { id: 'easy',   label: '🟢 Easy',   color: 'var(--success)' },
  { id: 'medium', label: '🟡 Medium', color: 'var(--primary)' },
  { id: 'hard',   label: '🔴 Hard',   color: 'var(--danger)' },
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
        style={{ border: '1.5px solid color-mix(in oklab, var(--primary) 35%, transparent)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-widest text-primary">ADD ROUND</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Round name */}
        <label className="block mb-4">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1.5">
            Round Name (optional)
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
            style={{
              background: 'color-mix(in oklab, var(--foreground) 6%, transparent)',
              border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
          />
        </label>

        {/* Question format */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Question Format</div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="text-left p-2.5 rounded-lg transition-all"
                style={categoryId === c.id
                  ? { background: 'color-mix(in oklab, var(--primary) 12%, transparent)', border: '1.5px solid var(--primary)' }
                  : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1.5px solid transparent' }
                }
              >
                <span className="mr-1.5">{c.icon}</span>
                <span className="font-medium text-foreground text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic / Subject filter */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Subject / Topic
            <span className="ml-2 text-subtle normal-case font-normal">optional filter</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* All topics option */}
            <button
              onClick={() => setTopicTag(ALL_TOPICS_TAG)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={topicTag === ALL_TOPICS_TAG
                ? { background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }
                : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1.5px solid transparent', color: 'var(--muted-foreground)' }
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
                  ? { background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1.5px solid var(--secondary)', color: 'var(--secondary)' }
                  : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1.5px solid transparent', color: 'var(--muted-foreground)' }
                }
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
          {topicTag !== ALL_TOPICS_TAG && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Only <span className="text-secondary font-semibold">{topicLabel}</span> questions will be used in this round.
            </p>
          )}
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Difficulty</div>
            {difficulty === 'all' && (
              <span className="text-[10px] text-primary">All difficulties shuffled together</span>
            )}
          </div>
          <div className="flex gap-2">
            {DIFFS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                style={difficulty === d.id
                  ? { background: `color-mix(in oklab, ${d.color} 9%, transparent)`, border: `1.5px solid ${d.color}`, color: d.color }
                  : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1.5px solid transparent', color: 'var(--muted-foreground)' }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {available} question{available !== 1 ? 's' : ''} available
            {difficulty === 'all' ? ' across all difficulties' : ''}
            {topicTag !== ALL_TOPICS_TAG ? ` · ${topicLabel} only` : ''}
          </p>
        </div>

        {/* Question limit */}
        <label className="block mb-6">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1.5">
            Question Limit (optional — leave blank to use all)
          </span>
          <input
            type="number"
            min="1"
            max={available}
            value={questionLimit}
            onChange={(e) => setQuestionLimit(e.target.value)}
            placeholder={`Max ${available}`}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
            style={{
              background: 'color-mix(in oklab, var(--foreground) 6%, transparent)',
              border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
          />
        </label>

        <button
          onClick={handleCreate}
          disabled={available === 0}
          className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
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
