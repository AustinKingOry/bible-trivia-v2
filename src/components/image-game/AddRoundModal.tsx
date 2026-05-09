'use client'

import { useState } from 'react'
import { useImageGameStore } from '@/store/imageGameStore'
import { PREDEFINED_TOPICS } from '@/lib/data'

interface Props { sessionId: string; onClose: () => void }

const DIFFS = [
  { id: 'all',    label: '⭐ All',    color: '#F5C842' },
  { id: 'easy',   label: '🟢 Easy',   color: '#6DFFAA' },
  { id: 'medium', label: '🟡 Medium', color: '#F5C842' },
  { id: 'hard',   label: '🔴 Hard',   color: '#FF8A80' },
] as const

export function AddRoundModal({ sessionId, onClose }: Props) {
  const { sessions, createRound, getAvailableCount } = useImageGameStore()
  const session = sessions[sessionId]
  const roundCount = session?.rounds.length ?? 0

  const [name, setName]               = useState('')
  const [topicTag, setTopicTag]       = useState('__all__')
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty]   = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [answerTime, setAnswerTime]   = useState(30)
  const [ptsCorrect, setPtsCorrect]   = useState(10)
  const [ptsWrong, setPtsWrong]       = useState(0)

  const activeTopic = customTopic.trim()
    ? customTopic.trim().toLowerCase().replace(/\s+/g, '-')
    : topicTag

  const resolvedTopic = activeTopic === '__all__' ? undefined : activeTopic
  const available = getAvailableCount(resolvedTopic, difficulty === 'all' ? undefined : difficulty)

  const defaultName = `Round ${roundCount + 1}${resolvedTopic ? ` — ${resolvedTopic}` : ''}`

  const handleCreate = () => {
    if (available === 0) return
    createRound(sessionId, {
      name: name.trim() || defaultName,
      topicTag: resolvedTopic,
      difficulty,
      answerTimeSecs: answerTime,
      pointsCorrect: ptsCorrect,
      pointsWrong: ptsWrong,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="panel w-full max-w-md animate-slide-up overflow-y-auto"
        style={{ border: '1.5px solid rgba(245,200,66,0.35)', maxHeight: '92vh' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-widest text-[#F5C842]">ADD ROUND</h2>
          <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
            Round Name (optional)
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)', fontFamily: 'var(--font-body)' }}
            onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')} />
        </div>

        {/* Topic */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">
            Topic Filter
            <span className="ml-2 text-[#4A5568] normal-case font-normal">optional — filters which images appear</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => { setTopicTag('__all__'); setCustomTopic('') }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={activeTopic === '__all__'
                ? { background: 'rgba(245,200,66,0.15)', border: '1.5px solid #F5C842', color: '#F5C842' }
                : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
              }>
              🌐 All topics
            </button>
            {PREDEFINED_TOPICS.map((t) => (
              <button key={t.tag}
                onClick={() => { setTopicTag(t.tag); setCustomTopic('') }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={activeTopic === t.tag
                  ? { background: 'rgba(123,47,190,0.2)', border: '1.5px solid #7B2FBE', color: '#C084FC' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
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
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-2">Difficulty</div>
          <div className="flex gap-2">
            {DIFFS.map((d) => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={difficulty === d.id
                  ? { background: `${d.color}18`, border: `1.5px solid ${d.color}`, color: d.color }
                  : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', color: '#9BA8C4' }
                }>{d.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[#9BA8C4] mt-1.5">
            {available} image{available !== 1 ? 's' : ''} available for this selection
            {resolvedTopic ? ` · ${resolvedTopic}` : ''}
          </p>
        </div>

        {/* Timing & scoring */}
        <div className="mb-5 rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-3">
            Timing &amp; Scoring
          </div>

          {/* Answer time slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#F0EDD8]">Answer Time</span>
              <span className="font-display text-xl text-[#F5C842]">{answerTime}s</span>
            </div>
            <input type="range" min={5} max={120} step={5} value={answerTime}
              onChange={(e) => setAnswerTime(Number(e.target.value))}
              className="w-full h-1 rounded-full cursor-pointer" style={{ accentColor: '#F5C842' }} />
            <div className="flex justify-between text-[9px] text-[#4A5568] mt-0.5">
              <span>5s</span><span>120s</span>
            </div>
          </div>

          {/* Points correct */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#F0EDD8]">Points — Correct</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPtsCorrect(Math.max(0, ptsCorrect - 5))}
                  className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}>−</button>
                <span className="font-display text-xl text-[#6DFFAA] min-w-[40px] text-center">+{ptsCorrect}</span>
                <button onClick={() => setPtsCorrect(Math.min(100, ptsCorrect + 5))}
                  className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}>+</button>
              </div>
            </div>
          </div>

          {/* Points wrong */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#F0EDD8]">Deduction — Wrong</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPtsWrong(Math.max(0, ptsWrong - 1))}
                  className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}>−</button>
                <span className="font-display text-xl text-[#FF8A80] min-w-[40px] text-center">
                  {ptsWrong > 0 ? `-${ptsWrong}` : '0'}
                </span>
                <button onClick={() => setPtsWrong(Math.min(50, ptsWrong + 1))}
                  className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#9BA8C4' }}>+</button>
              </div>
            </div>
            {ptsWrong === 0 && (
              <p className="text-[9px] text-[#4A5568]">Set above 0 to deduct points for wrong answers</p>
            )}
          </div>
        </div>

        <button onClick={handleCreate} disabled={available === 0}
          className="w-full py-3.5 rounded-lg font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
          onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}>
          CREATE ROUND
        </button>
        {available === 0 && (
          <p className="text-center text-xs text-red-400 mt-2">
            No images for this selection — add image questions first.
          </p>
        )}
      </div>
    </div>
  )
}
