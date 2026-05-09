'use client'

import { useState } from 'react'
import { useImageGameStore } from '@/store/imageGameStore'
import { useGameStore } from '@/store/gameStore'
import { PREDEFINED_TOPICS, ALL_TOPICS_TAG } from '@/lib/data'
import type { ImageQuestion } from '@/types/imageGame'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFS: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy',   label: '🟢 Easy',   color: '#6DFFAA' },
  { id: 'medium', label: '🟡 Medium', color: '#F5C842' },
  { id: 'hard',   label: '🔴 Hard',   color: '#FF8A80' },
]

const DIFF_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#6DFFAA', bg: 'rgba(26,138,74,0.15)',  border: 'rgba(26,138,74,0.4)'  },
  medium: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)', border: 'rgba(245,200,66,0.4)' },
  hard:   { color: '#FF8A80', bg: 'rgba(192,57,43,0.15)',  border: 'rgba(192,57,43,0.4)'  },
}

function AddImageForm({ onClose }: { onClose: () => void }) {
  const { addQuestion } = useImageGameStore()
  const allTopics = useGameStore((s) => s.getAllTopics())

  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [topicTag, setTopicTag] = useState('bible')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [imgError, setImgError] = useState(false)
  const [saved, setSaved] = useState(false)

  const handlePreview = () => {
    const url = imageUrl.trim()
    if (!url) return
    setImgError(false)
    setPreviewUrl(url)
  }

  const handleSave = () => {
    if (!previewUrl || !answer.trim()) return
    addQuestion({
      imageUrl: previewUrl,
      answer: answer.trim(),
      hint: hint.trim() || undefined,
      topicTag: topicTag || undefined,
      difficulty,
      source: 'manual',
    })
    setSaved(true)
    setTimeout(() => {
      setImageUrl(''); setPreviewUrl(''); setAnswer(''); setHint('')
      setImgError(false); setSaved(false)
    }, 900)
  }

  const canSave = !!previewUrl && !imgError && answer.trim().length > 0

  return (
    <div className="panel" style={{ border: '1.5px solid rgba(245,200,66,0.35)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg tracking-widest text-[#F5C842]">ADD IMAGE QUESTION</h3>
        <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors">×</button>
      </div>

      {/* URL input */}
      <div className="mb-3">
        <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
          Image URL *
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); setImgError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
            onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
          />
          <button
            onClick={handlePreview}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0"
            style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.35)', color: '#F5C842' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.28)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.15)')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Image preview */}
      {previewUrl && (
        <div className="mb-4 rounded-xl overflow-hidden flex items-center justify-center animate-slide-up"
          style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', minHeight: '180px', maxHeight: '280px' }}>
          {imgError ? (
            <div className="text-center text-[#9BA8C4] py-8">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="text-sm">Could not load image — check the URL</p>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full object-contain"
              style={{ maxHeight: '280px' }}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      )}

      {/* Answer */}
      <div className="mb-3">
        <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
          Answer (what they must identify) *
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="e.g. Mount Kilimanjaro"
          className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
          onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
        />
      </div>

      {/* Hint */}
      <div className="mb-4">
        <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
          Hint (optional — shown on request)
        </label>
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. It's the highest mountain in Africa"
          className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
          onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
        />
      </div>

      {/* Topic */}
      <div className="mb-4">
        <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-2">Topic</label>
        <div className="flex flex-wrap gap-1.5">
          {allTopics.map((t) => (
            <button
              key={t.tag}
              onClick={() => setTopicTag(t.tag)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={topicTag === t.tag
                ? { background: 'rgba(245,200,66,0.18)', border: '1.5px solid #F5C842', color: '#F5C842' }
                : { background: 'rgba(255,255,255,0.05)', border: '1.5px solid transparent', color: '#9BA8C4' }
              }
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-2">Difficulty</label>
        <div className="flex gap-2">
          {DIFFS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={difficulty === d.id
                ? { color: d.color, border: `1.5px solid ${d.color}`, background: `${d.color}18` }
                : { color: '#9BA8C4', border: '1.5px solid transparent', background: 'rgba(255,255,255,0.04)' }
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: saved ? '#1A8A4A' : 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
        onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
        onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        {saved ? '✓ SAVED!' : 'ADD IMAGE QUESTION'}
      </button>
    </div>
  )
}

export function ImageQuestionManager() {
  const { questions, deleteQuestion, getFilteredQuestions } = useImageGameStore()
  const allTopics = useGameStore((s) => s.getAllTopics())
  const [showAdd, setShowAdd] = useState(false)
  const [filterTopic, setFilterTopic] = useState(ALL_TOPICS_TAG)
  const [filterDiff, setFilterDiff] = useState('all')

  const filtered = getFilteredQuestions(
    filterTopic === ALL_TOPICS_TAG ? undefined : filterTopic,
    filterDiff === 'all' ? undefined : filterDiff
  )
  const total = Object.values(questions).filter((q) => !q.deletedAt).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#9BA8C4]">{total} image question{total !== 1 ? 's' : ''} in your bank</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {showAdd ? '× Cancel' : '+ Add Image'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && <AddImageForm onClose={() => setShowAdd(false)} />}

      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Topic filter */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[#9BA8C4] font-semibold uppercase tracking-widest mr-1">Topic:</span>
          <button
            onClick={() => setFilterTopic(ALL_TOPICS_TAG)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
            style={filterTopic === ALL_TOPICS_TAG
              ? { background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid transparent', color: '#9BA8C4' }
            }
          >All</button>
          {allTopics.map((t) => (
            <button key={t.tag} onClick={() => setFilterTopic(t.tag)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
              style={filterTopic === t.tag
                ? { background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.5)', color: '#C084FC' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid transparent', color: '#9BA8C4' }
              }
            ><span>{t.emoji}</span> {t.label}</button>
          ))}
        </div>
        {/* Difficulty filter */}
        <div className="flex gap-1.5 items-center">
          <span className="text-[10px] text-[#9BA8C4] font-semibold uppercase tracking-widest mr-1">Diff:</span>
          {['all', 'easy', 'medium', 'hard'].map((d) => {
            const colors: Record<string, string> = { all: '#9BA8C4', easy: '#6DFFAA', medium: '#F5C842', hard: '#FF8A80' }
            const active = filterDiff === d
            return (
              <button key={d} onClick={() => setFilterDiff(d)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all"
                style={active
                  ? { background: `${colors[d]}18`, color: colors[d], border: `1px solid ${colors[d]}55` }
                  : { color: '#9BA8C4', border: '1px solid transparent' }
                }
              >{d === 'all' ? 'All' : d}</button>
            )
          })}
        </div>
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#9BA8C4]">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="font-semibold text-[#F0EDD8] mb-1">
            {total === 0 ? 'No image questions yet' : 'No questions match your filters'}
          </p>
          <p className="text-sm">
            {total === 0 ? 'Click "+ Add Image" to add your first question.' : 'Try changing the topic or difficulty filter.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => {
            const ds = DIFF_STYLE[q.difficulty]
            const topic = allTopics.find((t) => t.tag === q.topicTag)
            return (
              <div key={q.id}
                className="group flex gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,200,66,0.1)' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.1)')}
              >
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={q.imageUrl} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}>
                      {q.difficulty}
                    </span>
                    {topic && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(123,47,190,0.15)', border: '1px solid rgba(123,47,190,0.3)', color: '#C084FC' }}>
                        {topic.emoji} {topic.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#F0EDD8] truncate">{q.answer}</p>
                  {q.hint && <p className="text-[10px] text-[#9BA8C4] mt-0.5 truncate">💡 {q.hint}</p>}
                  <p className="text-[9px] text-[#4A5568] mt-0.5 truncate">{q.imageUrl}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => { if (confirm('Delete this image question?')) deleteQuestion(q.id) }}
                  className="text-[#9BA8C4] hover:text-red-400 text-xl opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 self-start"
                >×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
