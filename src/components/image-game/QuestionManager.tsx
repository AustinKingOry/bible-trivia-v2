'use client'

import { useState } from 'react'
import { useImageGameStore } from '@/store/imageGameStore'
import { PREDEFINED_TOPICS } from '@/lib/data'

const DIFFS = ['easy', 'medium', 'hard'] as const
const DIFF_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: 'var(--success)', bg: 'color-mix(in oklab, var(--success-solid) 15%, transparent)',  border: 'color-mix(in oklab, var(--success-solid) 40%, transparent)'  },
  medium: { color: 'var(--primary)', bg: 'color-mix(in oklab, var(--primary) 12%, transparent)', border: 'color-mix(in oklab, var(--primary) 40%, transparent)' },
  hard:   { color: 'var(--danger)', bg: 'color-mix(in oklab, var(--danger-solid) 15%, transparent)',  border: 'color-mix(in oklab, var(--danger-solid) 40%, transparent)'  },
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
          <h3 className="font-display text-xl tracking-widest text-primary">IMAGE QUESTIONS</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{totalCount} total images</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={showAdd
            ? { background: 'color-mix(in oklab, var(--danger-solid) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--danger-solid) 40%, transparent)', color: 'var(--danger)' }
            : { background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }
          }
        >
          {showAdd ? '✕ Cancel' : '+ Add Image'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="panel animate-slide-up" style={{ border: '1.5px solid color-mix(in oklab, var(--primary) 35%, transparent)' }}>
          <h4 className="font-display text-lg tracking-widest text-primary mb-4">ADD IMAGE QUESTION</h4>

          {/* URL + preview */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1.5">
              Image URL <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url" value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(''); setPreviewError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
                style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)', fontFamily: 'var(--font-body)' }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
              />
              <button onClick={handlePreview}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0"
                style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }}>
                Preview
              </button>
            </div>
            {previewUrl && !previewError && (
              <div className="mt-3 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--background)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)', maxHeight: '280px' }}>
                <img src={previewUrl} alt="Preview" className="max-w-full object-contain"
                  style={{ maxHeight: '280px' }} onError={() => setPreviewError(true)} />
              </div>
            )}
            {previewError && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs text-danger"
                style={{ background: 'color-mix(in oklab, var(--danger-solid) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--danger-solid) 30%, transparent)' }}>
                ⚠️ Could not load image. Check the URL and ensure it&apos;s publicly accessible.
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Paste a direct image link (.jpg, .png, .webp, .gif). Must be publicly accessible.
            </p>
          </div>

          {/* Answer */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1.5">
              Answer <span className="text-danger">*</span>
            </label>
            <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
              placeholder="What should participants identify?"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
              style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')} />
          </div>

          {/* Hint */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1.5">
              Hint (optional)
            </label>
            <input type="text" value={hint} onChange={(e) => setHint(e.target.value)}
              placeholder="A small clue the admin can reveal"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden"
              style={{ background: 'color-mix(in oklab, var(--foreground) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)', fontFamily: 'var(--font-body)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')} />
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-2">
              Topic / Subject
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PREDEFINED_TOPICS.map((t) => (
                <button key={t.tag} onClick={() => { setTopicTag(t.tag); setCustomTopic('') }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                  style={activeTopic === t.tag
                    ? { background: 'color-mix(in oklab, var(--primary) 18%, transparent)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }
                    : { background: 'color-mix(in oklab, var(--foreground) 5%, transparent)', border: '1.5px solid transparent', color: 'var(--muted-foreground)' }
                  }>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
            <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or type a custom topic…" maxLength={32}
              className="w-full px-3 py-1.5 rounded-lg text-xs text-foreground outline-hidden"
              style={{ background: 'color-mix(in oklab, var(--foreground) 5%, transparent)', border: '1px solid color-mix(in oklab, var(--foreground) 10%, transparent)', fontFamily: 'var(--font-body)' }} />
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-2">
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
                      : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1.5px solid transparent', color: 'var(--muted-foreground)' }
                    }>{d}</button>
                )
              })}
            </div>
          </div>

          <button onClick={handleSave}
            disabled={!answer.trim() || (!previewUrl && !imageUrl.trim())}
            className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
            onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}>
            ADD IMAGE QUESTION
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Topic:</span>
        <button onClick={() => setFilterTopic('__all__')}
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
          style={filterTopic === '__all__'
            ? { background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }
            : { color: 'var(--muted-foreground)', border: '1px solid transparent' }}>All</button>
        {PREDEFINED_TOPICS.map((t) => (
          <button key={t.tag} onClick={() => setFilterTopic(t.tag)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
            style={filterTopic === t.tag
              ? { background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 50%, transparent)', color: 'var(--secondary)' }
              : { color: 'var(--muted-foreground)', border: '1px solid transparent' }}>
            {t.emoji} {t.label}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest ml-2">Diff:</span>
        {(['all', ...DIFFS] as const).map((d) => (
          <button key={d} onClick={() => setFilterDiff(d)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all"
            style={filterDiff === d
              ? { background: 'color-mix(in oklab, var(--primary) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }
              : { color: 'var(--muted-foreground)', border: '1px solid transparent' }}>
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="font-semibold text-foreground mb-1">No image questions</p>
          <p className="text-sm">Click &ldquo;+ Add Image&rdquo; to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((q) => {
            const ds = DIFF_STYLE[q.difficulty]
            return (
              <div key={q.id} className="group flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'color-mix(in oklab, var(--foreground) 3%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 10%, transparent)' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--primary) 25%, transparent)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--primary) 10%, transparent)')}>
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--background)', border: '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)' }}>
                  <img src={q.imageUrl} alt="thumb" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase"
                      style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}>
                      {q.difficulty}
                    </span>
                    {q.topicTag && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{ background: 'color-mix(in oklab, var(--secondary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 30%, transparent)', color: 'var(--secondary)' }}>
                        🏷️ {q.topicTag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    <span className="text-success">A: </span>{q.answer}
                  </p>
                  {q.hint && <p className="text-[10px] text-muted-foreground mt-0.5">💡 {q.hint}</p>}
                </div>
                <button
                  onClick={() => { if (confirm('Delete this image question?')) deleteQuestion(q.id) }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 text-xl transition-all shrink-0">
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