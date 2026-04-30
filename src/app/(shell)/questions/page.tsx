'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES } from '@/lib/data'
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

  const allQuestions = useGameStore((s) => s.getAllQuestions())
  const customQuestions = useGameStore((s) => s.customQuestions)
  const categorySettings = useGameStore((s) => s.categorySettings)

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId)!

  const categoryQuestions = allQuestions.filter((q) => {
    if (q.categoryId !== activeCategoryId) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    return true
  })

  const countFor = (catId: string) => allQuestions.filter((q) => q.categoryId === catId).length
  const customCountFor = (catId: string) =>
    Object.values(customQuestions).filter((q) => q.categoryId === catId).length

  // Count how many categories have modified settings
  const { DEFAULT_CATEGORY_SETTINGS } = require('@/lib/data')
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Page header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'rgba(245,200,66,0.18)', background: 'linear-gradient(135deg,#142240,#0D1E38)' }}
      >
        <div>
          <h1 className="font-display text-2xl tracking-widest text-gold-glow">QUESTIONS</h1>
          <p className="text-[#9BA8C4] text-xs tracking-wide mt-0.5">
            {allQuestions.length} total &middot; {Object.keys(customQuestions).length} custom added
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(123,47,190,0.18)', border: '1px solid rgba(123,47,190,0.4)', color: '#C084FC' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.32)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(123,47,190,0.18)')}
            title="Scoring & Timing Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
            Scoring &amp; Timing
            {modifiedSettingsCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: '#F5C842', color: '#0A1628' }}
              >
                {modifiedSettingsCount}
              </span>
            )}
          </button>

          {/* Tab toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(245,200,66,0.2)' }}>
            <button
              onClick={() => setTab('browse')}
              className="px-4 py-2 text-xs font-semibold transition-all"
              style={tab === 'browse' ? { background: 'rgba(245,200,66,0.15)', color: '#F5C842' } : { color: '#9BA8C4' }}
            >
              Browse
            </button>
            <button
              onClick={() => setTab('pdf')}
              className="px-4 py-2 text-xs font-semibold transition-all flex items-center gap-1.5"
              style={tab === 'pdf' ? { background: 'rgba(245,200,66,0.15)', color: '#F5C842' } : { color: '#9BA8C4' }}
            >
              <span>📄</span> AI Import
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide"
                style={{ background: 'rgba(123,47,190,0.3)', color: '#C084FC', border: '1px solid rgba(123,47,190,0.4)' }}
              >
                BETA
              </span>
            </button>
          </div>

          {tab === 'browse' && (
            <button
              onClick={() => { setEditingQuestion(null); setDrawerOpen(true) }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
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
            className="w-52 flex-shrink-0 border-r overflow-y-auto py-3"
            style={{ borderColor: 'rgba(245,200,66,0.12)', background: '#0D1E38' }}
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
                      ? { background: 'rgba(245,200,66,0.1)', borderRight: '2px solid #F5C842' }
                      : { borderRight: '2px solid transparent' }
                  }
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className={`text-xs font-semibold leading-tight ${active ? 'text-[#F5C842]' : 'text-[#F0EDD8]'}`}>
                      {cat.name}
                    </span>
                    {hasModifiedSettings && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] flex-shrink-0" title="Custom settings" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-[10px] text-[#9BA8C4]">{total} qs</span>
                    {custom > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(26,138,74,0.2)', color: '#6DFFAA', border: '1px solid rgba(26,138,74,0.3)' }}
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
              className="px-6 py-3 border-b flex items-center gap-4 flex-shrink-0"
              style={{ borderColor: 'rgba(245,200,66,0.12)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeCategory.icon}</span>
                  <h2 className="font-display text-lg tracking-wider text-[#F0EDD8]">{activeCategory.name}</h2>
                  <span className="text-xs text-[#9BA8C4]">· {categoryQuestions.length} shown</span>
                </div>
                <p className="text-[11px] text-[#9BA8C4] mt-0.5">{activeCategory.description}</p>
              </div>
              <div className="flex gap-1.5">
                {['all', 'easy', 'medium', 'hard'].map((d) => {
                  const colors: Record<string, string> = {
                    all: '#9BA8C4', easy: '#6DFFAA', medium: '#F5C842', hard: '#FF8A80',
                  }
                  const isActive = filterDifficulty === d
                  return (
                    <button
                      key={d}
                      onClick={() => setFilterDifficulty(d)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={
                        isActive
                          ? { background: `${colors[d]}18`, color: colors[d], border: `1px solid ${colors[d]}55` }
                          : { color: '#9BA8C4', border: '1px solid transparent' }
                      }
                    >
                      {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  )
                })}
              </div>
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