'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES, DEFAULT_CATEGORY_SETTINGS, SCORING_MODES } from '@/lib/data'
import type { Category, CategorySettings } from '@/types'

interface Props {
  onClose: () => void
  activeId: string
}

export function CategorySettingsPanel({ onClose, activeId }: Props) {
  const { categorySettings, updateCategorySettings, resetCategorySettings } = useGameStore()
  const [dirty, setDirty] = useState<Record<string, boolean>>({})

  const activeCategory = CATEGORIES.find((c) => c.id === activeId)!
  const settings = categorySettings[activeId] ?? DEFAULT_CATEGORY_SETTINGS[activeId]
  const isHotSeat = activeCategory.turnMode === 'continuous'
  const sm = SCORING_MODES[activeCategory.scoringModeId]

  const patch = (field: keyof CategorySettings, raw: string) => {
    const value = parseFloat(raw)
    if (isNaN(value)) return
    updateCategorySettings(activeId, { [field]: field.includes('Pts') || field.includes('Correct') || field.includes('Wrong') ? value : Math.max(1, Math.round(value)) })
    setDirty((d) => ({ ...d, [activeId]: true }))
  }

  const handleReset = () => {
    resetCategorySettings(activeId)
    setDirty((d) => ({ ...d, [activeId]: false }))
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col"
        style={{ background: '#0A1628', borderLeft: '1px solid rgba(245,200,66,0.25)', boxShadow: '-12px 0 60px rgba(0,0,0,0.6)', animation: 'drawerIn 0.25s ease-out' }}
      >
        <style>{`@keyframes drawerIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(245,200,66,0.2)', background: 'linear-gradient(135deg,#142240,#0D1E38)' }}>
          <div>
            <h2 className="font-display text-2xl tracking-widest text-gold-glow">SCORING & TIMING</h2>
            <p className="text-[#9BA8C4] text-xs mt-0.5">Adjust points and timers per category — changes apply immediately</p>
          </div>
          <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category nav */}
          {/* <div className="w-48 flex-shrink-0 border-r overflow-y-auto py-2" style={{ borderColor: 'rgba(245,200,66,0.12)', background: '#0D1E38' }}>
            {CATEGORIES.map((cat) => {
              const isDirty = dirty[cat.id]
              const isActive = cat.id === activeId
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={isActive
                    ? { background: 'rgba(245,200,66,0.1)', borderRight: '2px solid #F5C842' }
                    : { borderRight: '2px solid transparent' }
                  }
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#F5C842] flex-shrink-0" title="Modified" />}
                  </div>
                  <span className={`text-xs font-semibold leading-tight block mt-0.5 ${isActive ? 'text-[#F5C842]' : 'text-[#F0EDD8]'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div> */}

          {/* Settings content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <CategorySettingsForm
              category={activeCategory}
              settings={settings}
              isHotSeat={isHotSeat}
              allowSteal={sm?.allowSteal ?? false}
              allowPass={sm?.allowPass ?? false}
              onPatch={patch}
              onReset={handleReset}
              isDirty={dirty[activeId] ?? false}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Inner form ───────────────────────────────────────────────────────────────
function CategorySettingsForm({
  category, settings, isHotSeat, allowSteal, allowPass, onPatch, onReset, isDirty,
}: {
  category: Category
  settings: CategorySettings
  isHotSeat: boolean
  allowSteal: boolean
  allowPass: boolean
  onPatch: (field: keyof CategorySettings, value: string) => void
  onReset: () => void
  isDirty: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Category header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{category.icon}</span>
            <h3 className="font-display text-xl tracking-wider text-[#F0EDD8]">{category.name}</h3>
          </div>
          <p className="text-xs text-[#9BA8C4] leading-relaxed">{category.description}</p>
        </div>
        {isDirty && (
          <button
            onClick={onReset}
            className="flex-shrink-0 ml-4 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#F1948A' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.15)')}
          >
            ↺ Reset defaults
          </button>
        )}
      </div>

      {/* Rules */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.15)' }}>
        <h4 className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-3">Rules</h4>
        <ul className="flex flex-col gap-1.5">
          {category.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#F0EDD8] leading-relaxed">
              <span className="text-[#F5C842] mt-0.5 flex-shrink-0">›</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* ── SCORING ────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle icon="🏅" label="Scoring" />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Correct Answer"
            hint="Points awarded to the answering team"
            value={settings.pointsCorrect}
            min={0} max={100} step={1}
            color="#6DFFAA"
            prefix="+"
            onChange={(v) => onPatch('pointsCorrect', v)}
          />
          <NumberField
            label="Wrong Answer"
            hint={settings.pointsWrong === 0 ? 'No deduction for wrong answers' : 'Deducted from answering team'}
            value={settings.pointsWrong}
            min={-50} max={0} step={1}
            color={settings.pointsWrong < 0 ? '#FF8A80' : '#9BA8C4'}
            onChange={(v) => onPatch('pointsWrong', v)}
          />
          {allowSteal && (
            <NumberField
              label="Steal Points"
              hint="Points for a successful steal by opponents"
              value={settings.stealPoints}
              min={0} max={100} step={1}
              color="#74B9FF"
              prefix="+"
              onChange={(v) => onPatch('stealPoints', v)}
            />
          )}
        </div>
        {settings.pointsWrong === 0 && (
          <p className="text-[10px] text-[#9BA8C4] mt-2 italic">Set Wrong Answer to a negative number to enable deductions.</p>
        )}
      </section>

      {/* ── TIMERS ─────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle icon="⏱" label="Timers" />

        {isHotSeat ? (
          <div className="flex flex-col gap-3">
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.25)' }}
            >
              <p className="text-xs text-[#FFB347] leading-relaxed mb-3">
                Hot Seat uses a <strong>single session countdown</strong> — not per question. The team answers
                as many questions as possible before the timer hits zero.
              </p>
              <NumberField
                label="Hot Seat Duration"
                hint="Total time the team has for the entire hot-seat round"
                value={settings.hotSeatTimeSecs}
                min={10} max={300} step={5}
                color="#FFB347"
                suffix="sec"
                onChange={(v) => onPatch('hotSeatTimeSecs', v)}
              />
              <div className="mt-2 text-[10px] text-[#9BA8C4]">
                = {Math.floor(settings.hotSeatTimeSecs / 60)}m {settings.hotSeatTimeSecs % 60}s
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <NumberField
              label="Answer Time"
              hint="How long the active team has to answer before time expires"
              value={settings.answerTimeSecs}
              min={5} max={120} step={5}
              color="#F5C842"
              suffix="sec"
              onChange={(v) => onPatch('answerTimeSecs', v)}
            />
            {allowSteal && (
              <NumberField
                label="Steal Window"
                hint="How long opponents have to steal after the answer timer expires"
                value={settings.stealTimeSecs}
                min={3} max={30} step={1}
                color="#74B9FF"
                suffix="sec"
                onChange={(v) => onPatch('stealTimeSecs', v)}
              />
            )}
            {!allowSteal && (
              <div
                className="rounded-lg px-4 py-3 text-xs text-[#9BA8C4]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                This category has no steal mechanic — no steal window applies.
              </div>
            )}

            {/* Visual timeline */}
            <TimerTimeline
              answerSecs={settings.answerTimeSecs}
              stealSecs={allowSteal ? settings.stealTimeSecs : 0}
            />
          </div>
        )}
      </section>

      {/* Summary card */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h4 className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-3">Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <SumRow label="Correct" value={`+${settings.pointsCorrect} pts`} color="#6DFFAA" />
          <SumRow label="Wrong" value={settings.pointsWrong !== 0 ? `${settings.pointsWrong} pts` : 'No deduction'} color={settings.pointsWrong < 0 ? '#FF8A80' : '#9BA8C4'} />
          {allowSteal && <SumRow label="Steal" value={`+${settings.stealPoints} pts`} color="#74B9FF" />}
          {allowPass && <SumRow label="Pass" value="No points" color="#9BA8C4" />}
          {isHotSeat
            ? <SumRow label="Session time" value={`${settings.hotSeatTimeSecs}s`} color="#FFB347" />
            : <SumRow label="Answer window" value={`${settings.answerTimeSecs}s`} color="#F5C842" />
          }
          {!isHotSeat && allowSteal && <SumRow label="Steal window" value={`${settings.stealTimeSecs}s`} color="#74B9FF" />}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(245,200,66,0.12)' }}>
      <span>{icon}</span>
      <h4 className="font-display text-base tracking-widest text-[#F5C842]">{label}</h4>
    </div>
  )
}

function SumRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#9BA8C4]">{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}

function NumberField({
  label, hint, value, min, max, step, color, prefix, suffix, onChange,
}: {
  label: string; hint: string; value: number; min: number; max: number; step: number
  color: string; prefix?: string; suffix?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-[11px] font-semibold text-[#F0EDD8] mb-0.5">{label}</div>
      <div className="text-[10px] text-[#9BA8C4] mb-3 leading-relaxed">{hint}</div>

      {/* Stepper */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(String(Math.max(min, value - step)))}
          className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          −
        </button>

        <div className="flex-1 text-center">
          <div className="font-display text-3xl tracking-wide" style={{ color }}>
            {prefix}{value}{suffix}
          </div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 h-1 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: color }}
          />
          <div className="flex justify-between text-[9px] text-[#9BA8C4] mt-0.5">
            <span>{min}{suffix}</span>
            <span>{max}{suffix}</span>
          </div>
        </div>

        <button
          onClick={() => onChange(String(Math.min(max, value + step)))}
          className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          +
        </button>
      </div>
    </div>
  )
}

function TimerTimeline({ answerSecs, stealSecs }: { answerSecs: number; stealSecs: number }) {
  const total = answerSecs + stealSecs
  const answerPct = (answerSecs / total) * 100
  const stealPct = (stealSecs / total) * 100

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-3">Per-Question Timeline</div>
      <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-[#0A1628] rounded-l-lg transition-all"
          style={{ width: `${answerPct}%`, background: '#F5C842' }}
          title={`Answer: ${answerSecs}s`}
        >
          {answerSecs}s
        </div>
        {stealSecs > 0 && (
          <div
            className="flex items-center justify-center text-[10px] font-bold text-[#0A1628] rounded-r-lg transition-all"
            style={{ width: `${stealPct}%`, background: '#2E86DE' }}
            title={`Steal: ${stealSecs}s`}
          >
            {stealSecs}s
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-[#9BA8C4] mt-1.5">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#F5C842' }} />
          Answer window
        </div>
        {stealSecs > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#2E86DE' }} />
            Steal window
          </div>
        )}
      </div>
    </div>
  )
}
