'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES, DEFAULT_CATEGORY_SETTINGS, PREDEFINED_TOPICS, ALL_TOPICS_TAG } from '@/lib/data'
import { QuestionList } from '@/components/questions/QuestionList'
import { AddQuestionDrawer } from '@/components/questions/AddQuestionDrawer'
import { PdfUploadPanel } from '@/components/questions/PdfUploadPanel'
import { CategorySettingsPanel } from '@/components/questions/CategorySettingsPanel'
import type { Question } from '@/types'

type Tab = 'browse' | 'pdf'

export default function QuestionsPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id)
  const [tab, setTab] = useState<Tab>('browse')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterTopic, setFilterTopic] = useState<string>(ALL_TOPICS_TAG)

  const allQuestions = useGameStore((s) => s.getAllQuestions())
  const customQuestions = useGameStore((s) => s.customQuestions)
  const categorySettings = useGameStore((s) => s.categorySettings)
  const allTopics = useGameStore((s) => s.getAllTopics())

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId)!

  const categoryQuestions = allQuestions.filter((q) => {
    if (q.categoryId !== activeCategoryId) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    if (filterTopic !== ALL_TOPICS_TAG && q.topicTag !== filterTopic) return false
    return true
  })

  const countFor = (catId: string) => allQuestions.filter((q) => q.categoryId === catId).length
  const customCountFor = (catId: string) =>
    Object.values(customQuestions).filter((q) => q.categoryId === catId).length

  // Count how many categories have modified settings
  // DEFAULT_CATEGORY_SETTINGS imported at top
  const modifiedSettingsCount = CATEGORIES.filter((cat) => {
    const stored = categorySettings[cat.id]
    const def = DEFAULT_CATEGORY_SETTINGS[cat.id]
    if (!stored) return false
    return JSON.stringify(stored) !== JSON.stringify(def)
  }).length

  const handleEdit = (q: Question) => {
    setEditingQuestion(q)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingQuestion(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between shrink-0"
        style={{ borderColor: 'color-mix(in oklab, var(--primary) 18%, transparent)', background: 'linear-gradient(135deg,var(--card),var(--sidebar))' }}
      >
        <div>
          <h1 className="font-display text-2xl tracking-widest text-gold-glow">QUESTIONS</h1>
          <p className="text-muted-foreground text-xs tracking-wide mt-0.5">
            {allQuestions.length} total &middot; {Object.keys(customQuestions).length} custom added
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'color-mix(in oklab, var(--secondary) 18%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)', color: 'var(--secondary)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--secondary) 32%, transparent)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--secondary) 18%, transparent)')}
            title="Scoring & Timing Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
            Scoring &amp; Timing
            {modifiedSettingsCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: 'var(--primary)', color: 'var(--background)' }}
              >
                {modifiedSettingsCount}
              </span>
            )}
          </button>

          {/* Tab toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)' }}>
            <button
              onClick={() => setTab('browse')}
              className="px-4 py-2 text-xs font-semibold transition-all"
              style={tab === 'browse' ? { background: 'color-mix(in oklab, var(--primary) 15%, transparent)', color: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
            >
              Browse
            </button>
            <button
              onClick={() => setTab('pdf')}
              className="px-4 py-2 text-xs font-semibold transition-all flex items-center gap-1.5"
              style={tab === 'pdf' ? { background: 'color-mix(in oklab, var(--primary) 15%, transparent)', color: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
            >
              <span>📄</span> AI Import
              <span
                className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wide"
                style={{ background: 'color-mix(in oklab, var(--secondary) 30%, transparent)', color: 'var(--secondary)', border: '1px solid color-mix(in oklab, var(--secondary) 40%, transparent)' }}
              >
                BETA
              </span>
            </button>
          </div>

          {tab === 'browse' && (
            <button
              onClick={() => { setEditingQuestion(null); setDrawerOpen(true) }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-strong))', color: 'var(--background)' }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              + Add Question
            </button>
          )}
        </div>
      </div>

      {tab === 'browse' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div
            className="w-52 shrink-0 border-r overflow-y-auto py-3"
            style={{ borderColor: 'color-mix(in oklab, var(--primary) 12%, transparent)', background: 'var(--sidebar)' }}
          >
            {CATEGORIES.map((cat) => {
              const total = countFor(cat.id)
              const custom = customCountFor(cat.id)
              const active = cat.id === activeCategoryId
              const hasModifiedSettings = (() => {
                const stored = categorySettings[cat.id]
                const def = DEFAULT_CATEGORY_SETTINGS[cat.id]
                return stored && JSON.stringify(stored) !== JSON.stringify(def)
              })()

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={
                    active
                      ? { background: 'color-mix(in oklab, var(--primary) 10%, transparent)', borderRight: '2px solid var(--primary)' }
                      : { borderRight: '2px solid transparent' }
                  }
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'color-mix(in oklab, var(--foreground) 4%, transparent)' }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className={`text-xs font-semibold leading-tight ${active ? 'text-primary' : 'text-foreground'}`}>
                      {cat.name}
                    </span>
                    {hasModifiedSettings && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" title="Custom settings" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-[10px] text-muted-foreground">{total} qs</span>
                    {custom > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in oklab, var(--success-solid) 30%, transparent)' }}
                      >
                        +{custom}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category header + filters */}
            <div
              className="px-6 py-3 border-b flex items-center gap-4 shrink-0"
              style={{ borderColor: 'color-mix(in oklab, var(--primary) 12%, transparent)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeCategory.icon}</span>
                  <h2 className="font-display text-lg tracking-wider text-foreground">{activeCategory.name}</h2>
                  <span className="text-xs text-muted-foreground">· {categoryQuestions.length} shown</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{activeCategory.description}</p>
              </div>
              <div className="flex gap-1.5">
                {['all', 'easy', 'medium', 'hard'].map((d) => {
                  const colors: Record<string, string> = {
                    all: 'var(--muted-foreground)', easy: 'var(--success)', medium: 'var(--primary)', hard: 'var(--danger)',
                  }
                  const isActive = filterDifficulty === d
                  return (
                    <button
                      key={d}
                      onClick={() => setFilterDifficulty(d)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={
                        isActive
                          ? { background: `color-mix(in oklab, ${colors[d]} 9%, transparent)`, color: colors[d], border: `1px solid color-mix(in oklab, ${colors[d]} 33%, transparent)` }
                          : { color: 'var(--muted-foreground)', border: '1px solid transparent' }
                      }
                    >
                      {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Topic filter row */}
            <div
              className="px-6 py-2 border-b flex items-center gap-2 flex-wrap shrink-0"
              style={{ borderColor: 'color-mix(in oklab, var(--primary) 8%, transparent)' }}
            >
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mr-1 shrink-0">Topic:</span>
              <button
                onClick={() => setFilterTopic(ALL_TOPICS_TAG)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                style={filterTopic === ALL_TOPICS_TAG
                  ? { background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)', color: 'var(--primary)' }
                  : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid transparent', color: 'var(--muted-foreground)' }
                }
              >
                All topics
              </button>
              {allTopics.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setFilterTopic(t.tag)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                  style={filterTopic === t.tag
                    ? { background: 'color-mix(in oklab, var(--secondary) 20%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 50%, transparent)', color: 'var(--secondary)' }
                    : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid transparent', color: 'var(--muted-foreground)' }
                  }
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>

            <QuestionList
              questions={categoryQuestions}
              category={activeCategory}
              onEdit={handleEdit}
              onAdd={() => { setEditingQuestion(null); setDrawerOpen(true) }}
            />
          </div>
        </div>
      ) : (
        <PdfUploadPanel />
      )}

      {drawerOpen && (
        <AddQuestionDrawer
          category={activeCategory}
          editingQuestion={editingQuestion}
          onClose={handleCloseDrawer}
        />
      )}

      {settingsOpen && (
        <CategorySettingsPanel onClose={() => setSettingsOpen(false)} activeId={activeCategoryId} />
      )}
    </div>
  )
}