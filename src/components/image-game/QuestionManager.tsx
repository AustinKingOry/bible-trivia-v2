'use client'

import { useState } from 'react'
import { useImageGameStore } from '@/store/imageGameStore'
import { PREDEFINED_TOPICS } from '@/lib/data'

const DIFFS = ['easy', 'medium', 'hard'] as const
const DIFF_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#6DFFAA', bg: 'rgba(26,138,74,0.15)',  border: 'rgba(26,138,74,0.4)'  },
  medium: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)', border: 'rgba(245,200,66,0.4)' },
  hard:   { color: '#FF8A80', bg: 'rgba(192,57,43,0.15)',  border: 'rgba(192,57,43,0.4)'  },
}

export function ImageQuestionManager() {
  const { questions, addQuestion, deleteQuestion, getFilteredQuestions } = useImageGameStore()

  const [showAdd, setShowAdd] = useState(false)
  const [filterTopic, setFilterTopic] = useState('__all__')
  const [filterDiff, setFilterDiff] = useState('all')

  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState(false)
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [topicTag, setTopicTag] = useState('bible')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [customTopic, setCustomTopic] = useState('')

  const filtered = getFilteredQuestions(
    filterTopic === '__all__' ? undefined : filterTopic,
    filterDiff === 'all' ? undefined : filterDiff,
  )
  const totalCount = Object.values(questions).filter((q) => !q.deletedAt).length
  const activeTopic = customTopic.trim()
    ? customTopic.trim().toLowerCase().replace(/\s+/g, '-')
    : topicTag

  const handlePreview = () => {
    const url = imageUrl.trim()
    if (!url) return
    setPreviewUrl(url)
    setPreviewError(false)
  }

  const handleSave = () => {
    const url = (previewUrl || imageUrl).trim()
    if (!url || !answer.trim()) return
    const finalTopic = customTopic.trim()
      ? customTopic.trim().toLowerCase().replace(/\s+/g, '-')
      : topicTag
    addQuestion({ imageUrl: url, answer: answer.trim(), hint: hint.trim() || undefined, topicTag: finalTopic, difficulty, source: 'manual' })
    setImageUrl(''); setPreviewUrl(''); setPreviewError(false)
    setAnswer(''); setHint(''); setTopicTag('bible'); setCustomTopic(''); setDifficulty('easy')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl tracking-widest text-[#F5C842]">IMAGE QUESTIONS</h3>
          <p className="text-[10px] text-[#9BA8C4] mt-0.5">{totalCount} total images</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={showAdd
            ? { background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#F1948A' }
            : { background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }
          }
        >
          {showAdd ? '✕ Cancel' : '+ Add Image'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="panel animate-slide-up" style={{ border: '1.5px solid rgba(245,200,66,0.35)' }}>
          <h4 className="font-display text-lg tracking-widest text-[#F5C842] mb-4">ADD IMAGE QUESTION</h4>

          {/* URL + preview */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
              Image URL <span className="text-[#FF8A80]">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url" value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(''); setPreviewError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
                onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
              />
              <button onClick={handlePreview}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0"
                style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }}>
                Preview
              </button>
            </div>
            {previewUrl && !previewError && (
              <div className="mt-3 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: '#0A1628', border: '1px solid rgba(245,200,66,0.2)', maxHeight: '280px' }}>
                <img src={previewUrl} alt="Preview" className="max-w-full object-contain"
                  style={{ maxHeight: '280px' }} onError={() => setPreviewError(true)} />
              </div>
            )}
            {previewError && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs text-[#FF8A80]"
                style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)' }}>
                ⚠️ Could not load image. Check the URL and ensure it&apos;s publicly accessible.
              </div>
            )}
            <p className="text-[10px] text-[#9BA8C4] mt-1.5">
              Paste a direct image link (.jpg, .png, .webp, .gif). Must be publicly accessible.
            </p>
          </div>

          {/* Answer */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
              Answer <span className="text-[#FF8A80]">*</span>
            </label>
            <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
              placeholder="What should participants identify?"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')} />
          </div>

          {/* Hint */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
              Hint (optional)
            </label>
            <input type="text" value={hint} onChange={(e) => setHint(e.target.value)}
              placeholder="A small clue the admin can reveal"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')} />
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-2">
              Topic / Subject
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PREDEFINED_TOPICS.map((t) => (
                <button key={t.tag} onClick={() => { setTopicTag(t.tag); setCustomTopic('') }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                  style={activeTopic === t.tag
                    ? { background: 'rgba(245,200,66,0.18)', border: '1.5px solid #F5C842', color: '#F5C842' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1.5px solid transparent', color: '#9BA8C4' }
                  }>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
            <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or type a custom topic…" maxLength={32}
              className="w-full px-3 py-1.5 rounded-lg text-xs text-[#F0EDD8] outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }} />
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-2">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFS.map((d) => {
                const ds = DIFF_STYLE[d]
                return (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={difficulty === d
                      ? { background: ds.bg, border: `1.5px solid ${ds.border}`, color: ds.color }
                      : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
                    }>{d}</button>
                )
              })}
            </div>
          </div>

          <button onClick={handleSave}
            disabled={!answer.trim() || (!previewUrl && !imageUrl.trim())}
            className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
            onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}>
            ADD IMAGE QUESTION
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] text-[#9BA8C4] font-semibold uppercase tracking-widest">Topic:</span>
        <button onClick={() => setFilterTopic('__all__')}
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
          style={filterTopic === '__all__'
            ? { background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }
            : { color: '#9BA8C4', border: '1px solid transparent' }}>All</button>
        {PREDEFINED_TOPICS.map((t) => (
          <button key={t.tag} onClick={() => setFilterTopic(t.tag)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
            style={filterTopic === t.tag
              ? { background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.5)', color: '#C084FC' }
              : { color: '#9BA8C4', border: '1px solid transparent' }}>
            {t.emoji} {t.label}
          </button>
        ))}
        <span className="text-[10px] text-[#9BA8C4] font-semibold uppercase tracking-widest ml-2">Diff:</span>
        {(['all', ...DIFFS] as const).map((d) => (
          <button key={d} onClick={() => setFilterDiff(d)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all"
            style={filterDiff === d
              ? { background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }
              : { color: '#9BA8C4', border: '1px solid transparent' }}>
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#9BA8C4]">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="font-semibold text-[#F0EDD8] mb-1">No image questions</p>
          <p className="text-sm">Click &ldquo;+ Add Image&rdquo; to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((q) => {
            const ds = DIFF_STYLE[q.difficulty]
            return (
              <div key={q.id} className="group flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,200,66,0.1)' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.1)')}>
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={q.imageUrl} alt="thumb" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}>
                      {q.difficulty}
                    </span>
                    {q.topicTag && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{ background: 'rgba(123,47,190,0.15)', border: '1px solid rgba(123,47,190,0.3)', color: '#C084FC' }}>
                        🏷️ {q.topicTag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#F0EDD8] truncate">
                    <span className="text-[#6DFFAA]">A: </span>{q.answer}
                  </p>
                  {q.hint && <p className="text-[10px] text-[#9BA8C4] mt-0.5">💡 {q.hint}</p>}
                </div>
                <button
                  onClick={() => { if (confirm('Delete this image question?')) deleteQuestion(q.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[#9BA8C4] hover:text-red-400 text-xl transition-all flex-shrink-0">
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}