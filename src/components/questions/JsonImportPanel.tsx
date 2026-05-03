'use client'

import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { CATEGORIES } from '@/lib/data'
import type { Difficulty, Question } from '@/types'

// ─── The exact JSON schema we expect (and tell the LLM to produce) ────────────
export interface ImportedQuestion {
  categoryId: 'quote' | 'general' | 'character' | 'hotseat' | 'openverse' | 'truefalse'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer: string
  topicTag?: string       // subject matter — e.g. 'bible', 'science', 'nature'
  // optional enrichment
  verseRef?: string          // quote category
  partialVerse?: string      // quote category
  completion?: string        // quote category
  book?: string              // openverse
  chapter?: number           // openverse
  verse?: number             // openverse
  verseText?: string         // openverse
  statement?: string         // truefalse
  isTrue?: boolean           // truefalse
  explanation?: string       // truefalse
  challenge?: string         // hotseat
  acceptableAnswers?: string[]// hotseat
}

// ─── Validation ───────────────────────────────────────────────────────────────
interface ValidationResult {
  valid: ImportedQuestion[]
  errors: Array<{ index: number; message: string; raw: unknown }>
}

const VALID_CATEGORIES = ['quote', 'general', 'character', 'hotseat', 'openverse', 'truefalse']
const VALID_DIFFS = ['easy', 'medium', 'hard']

function validateImport(raw: unknown): ValidationResult {
  const valid: ImportedQuestion[] = []
  const errors: ValidationResult['errors'] = []

  const arr = Array.isArray(raw) ? raw : (raw as any)?.questions ?? null
  if (!arr || !Array.isArray(arr)) {
    errors.push({ index: -1, message: 'JSON must be an array of questions, or an object with a "questions" array.', raw })
    return { valid, errors }
  }

  arr.forEach((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) {
      errors.push({ index: i, message: 'Each item must be an object.', raw: item }); return
    }
    const q = item as Record<string, unknown>
    if (!q.categoryId || !VALID_CATEGORIES.includes(q.categoryId as string)) {
      errors.push({ index: i, message: `Invalid or missing categoryId. Must be one of: ${VALID_CATEGORIES.join(', ')}`, raw: item }); return
    }
    if (!q.difficulty || !VALID_DIFFS.includes(q.difficulty as string)) {
      errors.push({ index: i, message: `Invalid or missing difficulty. Must be: easy, medium, or hard`, raw: item }); return
    }
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 5) {
      errors.push({ index: i, message: 'Missing or too-short "question" field.', raw: item }); return
    }
    if (!q.answer || typeof q.answer !== 'string' || q.answer.trim().length < 1) {
      errors.push({ index: i, message: 'Missing "answer" field.', raw: item }); return
    }
    valid.push(item as ImportedQuestion)
  })

  return { valid, errors }
}

// ─── Convert ImportedQuestion → store-ready shape ─────────────────────────────
function toStoreQuestion(q: ImportedQuestion): Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'synced'> {
  const base = {
    categoryId: q.categoryId,
    difficulty: q.difficulty as Difficulty,
    question: q.question.trim(),
    answer: q.answer.trim(),
    source: 'ai' as const,
    topicTag: q.topicTag?.toLowerCase().trim() || undefined,
  }

  if (q.categoryId === 'quote' && (q.verseRef || q.partialVerse)) {
    return { ...base, quoteFields: { verseRef: q.verseRef ?? '', partialVerse: q.partialVerse ?? q.question, completion: q.completion ?? q.answer } }
  }
  if (q.categoryId === 'openverse' && q.book) {
    return { ...base, openVerseFields: { book: q.book, chapter: q.chapter ?? 1, verse: q.verse ?? 1, verseText: q.verseText ?? q.answer } }
  }
  if (q.categoryId === 'truefalse' && q.statement) {
    return { ...base, trueFalseFields: { statement: q.statement, isTrue: q.isTrue ?? true, explanation: q.explanation ?? '' } }
  }
  if (q.categoryId === 'hotseat' && q.challenge) {
    return { ...base, hotSeatFields: { challenge: q.challenge, acceptableAnswers: q.acceptableAnswers ?? [] } }
  }
  return base
}

// ─── The prompt the admin copies to give to Claude / ChatGPT ─────────────────
const SYSTEM_PROMPT = `You are a Bible trivia question extractor. Given the content I provide, extract or generate Bible trivia questions and return ONLY a valid JSON array. No explanation, no markdown fences, no preamble — raw JSON only.

Each question object must follow this exact schema:

{
  "categoryId": "general" | "quote" | "character" | "hotseat" | "openverse" | "truefalse",
  "difficulty": "easy" | "medium" | "hard",
  "question": "The question text shown to teams",
  "answer": "The correct answer",
  "topicTag": "bible" | "science" | "nature" | "technology" | "history" | "geography" | "sport" | "music" | "film" | "literature" | "maths" | "food" | "general" | "any-custom-string"
}

Category-specific optional fields (include these if the category warrants them):

For "quote":
  "verseRef": "John 3:16",
  "partialVerse": "For God so loved the world...",
  "completion": "have eternal life"

For "openverse":
  "book": "Genesis",
  "chapter": 1,
  "verse": 1,
  "verseText": "In the beginning God created..."

For "truefalse":
  "statement": "Jesus had 12 disciples.",
  "isTrue": true,
  "explanation": "Matthew 10:2-4 lists the 12 apostles."

For "hotseat":
  "challenge": "Name as many books of the NT as you can",
  "acceptableAnswers": ["Matthew", "Mark", "Luke", ...]

For "character":
  No extra fields — write the question as a first-person clue ending with "Who am I?"

topicTag is the SUBJECT MATTER — what the question is about:
- Use 'bible' for biblical / scripture questions
- Use 'science', 'nature', 'technology', 'history', 'geography', 'sport', 'music', 'film', 'literature', 'maths', 'food' for other subjects
- Use any lowercase hyphenated string for a custom topic (e.g. 'greek-mythology', 'african-history')

Category definitions (these are the FORMAT, not the subject):
- general: open knowledge questions
- quote: complete the missing words of a verse
- character: first-person clues, teams name the Bible character
- hotseat: listing challenge (as many X as possible in 30 seconds)
- openverse: teams open their Bible to a specific verse and read it aloud
- truefalse: true/false statement about the Bible

Difficulty guidelines:
- easy: widely known facts, famous verses (John 3:16, Genesis 1:1)
- medium: less common knowledge, requires regular Bible reading
- hard: detailed knowledge, specific numbers/names/sequences

Return an array. Example:
[
  { "categoryId": "general", "difficulty": "easy", "question": "Who built the ark?", "answer": "Noah" },
  { "categoryId": "truefalse", "difficulty": "medium", "question": "True or False: Methuselah lived 969 years.", "answer": "TRUE — Genesis 5:27", "statement": "Methuselah lived 969 years.", "isTrue": true, "explanation": "Genesis 5:27 confirms 969 years." }
]`

// ─── Category helpers ─────────────────────────────────────────────────────────
const DIFF_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#6DFFAA', bg: 'rgba(26,138,74,0.15)',  border: 'rgba(26,138,74,0.4)'  },
  medium: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)', border: 'rgba(245,200,66,0.4)' },
  hard:   { color: '#FF8A80', bg: 'rgba(192,57,43,0.15)',  border: 'rgba(192,57,43,0.4)'  },
}

type ImportStep = 'prompt' | 'paste' | 'preview'

// ─── Main component ───────────────────────────────────────────────────────────
export function JsonImportPanel() {
  const { addQuestion } = useGameStore()

  const [step, setStep] = useState<ImportStep>('prompt')
  const [jsonText, setJsonText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [approved, setApproved] = useState<Set<number>>(new Set())
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Copy prompt ────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(SYSTEM_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Parse + validate JSON ──────────────────────────────────────────────────
  const handleParse = useCallback(() => {
    setParseError(null)
    setValidation(null)
    setApproved(new Set())
    setSavedCount(null)

    if (!jsonText.trim()) { setParseError('Paste your JSON first.'); return }

    let parsed: unknown
    try {
      // Strip markdown fences if the LLM wrapped it
      const cleaned = jsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(cleaned)
    } catch (e) {
      setParseError(`Invalid JSON: ${(e as Error).message}`)
      return
    }

    const result = validateImport(parsed)
    setValidation(result)
    // Pre-approve all valid questions
    setApproved(new Set(result.valid.map((_, i) => i)))
    setStep('preview')
  }, [jsonText])

  // ── Save approved questions ────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!validation) return
    let count = 0
    validation.valid.forEach((q, i) => {
      if (approved.has(i)) {
        addQuestion(toStoreQuestion(q))
        count++
      }
    })
    setSavedCount(count)
  }, [validation, approved, addQuestion])

  const toggleApprove = (i: number) =>
    setApproved((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next })

  const approveAll = () => setApproved(new Set(validation?.valid.map((_, i) => i) ?? []))
  const rejectAll  = () => setApproved(new Set())

  const catLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.name ?? id
  const catIcon  = (id: string) => CATEGORIES.find(c => c.id === id)?.icon ?? '❓'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 px-6 pt-5 pb-0 mb-6 max-w-3xl mx-auto">
        {(['prompt', 'paste', 'preview'] as ImportStep[]).map((s, i) => {
          const labels = ['1. Copy Prompt', '2. Paste JSON', '3. Review & Save']
          const isActive = step === s
          const isDone = (['prompt','paste','preview'] as ImportStep[]).indexOf(step) > i
          return (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => { if (isDone || isActive) setStep(s) }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={isActive
                  ? { background: 'rgba(245,200,66,0.12)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.3)' }
                  : isDone
                  ? { color: '#6DFFAA', cursor: 'pointer' }
                  : { color: '#9BA8C4' }
                }
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={isActive ? { background: '#F5C842', color: '#0A1628' } : isDone ? { background: 'rgba(26,138,74,0.3)', color: '#6DFFAA' } : { background: 'rgba(255,255,255,0.1)', color: '#9BA8C4' }}>
                  {isDone ? '✓' : i + 1}
                </span>
                {labels[i]}
              </button>
              {i < 2 && <div className="flex-1 h-px mx-2" style={{ background: isDone ? 'rgba(26,138,74,0.4)' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          )
        })}
      </div>

      <div className="px-6 pb-8 max-w-3xl mx-auto">

        {/* ── STEP 1: Copy prompt ──────────────────────────────────────────── */}
        {step === 'prompt' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h3 className="font-display text-xl tracking-widest text-[#F0EDD8] mb-1">Get the AI Prompt</h3>
              <p className="text-xs text-[#9BA8C4] leading-relaxed">
                Copy the prompt below, then open <strong className="text-[#F0EDD8]">ChatGPT, Claude, or Gemini</strong>.
                Paste the prompt first, then paste or describe your Bible content (a PDF excerpt, chapter, topic, etc.).
                The AI will return a JSON array of questions. Come back here and paste that JSON in the next step.
              </p>
            </div>

            {/* Prompt box */}
            <div className="relative rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(123,47,190,0.35)' }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: 'rgba(123,47,190,0.15)', borderColor: 'rgba(123,47,190,0.3)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[#C084FC] text-sm">📋</span>
                  <span className="text-xs font-semibold text-[#C084FC] tracking-wide">AI Extraction Prompt</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={copied
                    ? { background: 'rgba(26,138,74,0.25)', border: '1px solid rgba(26,138,74,0.5)', color: '#6DFFAA' }
                    : { background: 'rgba(123,47,190,0.25)', border: '1px solid rgba(123,47,190,0.4)', color: '#C084FC' }
                  }
                >
                  {copied ? '✓ Copied!' : '⎘ Copy prompt'}
                </button>
              </div>
              <pre
                className="text-[11px] text-[#9BA8C4] leading-relaxed overflow-auto p-4 max-h-72 select-all"
                style={{ background: 'rgba(0,0,0,0.3)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {SYSTEM_PROMPT}
              </pre>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: '📖', tip: 'Paste a Bible chapter or passage and ask for questions from it' },
                { icon: '📄', tip: 'Upload your PDF in Claude/ChatGPT, then paste this prompt' },
                { icon: '🎯', tip: 'Specify "10 easy True or False questions" to guide the output' },
                { icon: '🔁', tip: 'Run it again for more questions — duplicates are easy to deselect' },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-lg flex-shrink-0">{t.icon}</span>
                  <p className="text-[11px] text-[#9BA8C4] leading-relaxed">{t.tip}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('paste')}
              className="w-full py-3.5 rounded-xl font-display text-xl tracking-widest transition-all"
              style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              I HAVE MY JSON → NEXT
            </button>
          </div>
        )}

        {/* ── STEP 2: Paste JSON ───────────────────────────────────────────── */}
        {step === 'paste' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h3 className="font-display text-xl tracking-widest text-[#F0EDD8] mb-1">Paste Your JSON</h3>
              <p className="text-xs text-[#9BA8C4]">
                Paste the raw JSON returned by the AI. Markdown code fences (<code className="text-[#F5C842]">```json</code>) are stripped automatically.
              </p>
            </div>

            <div className="relative mb-3">
              <textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setParseError(null) }}
                placeholder={`Paste JSON here — e.g.\n[\n  {\n    "categoryId": "general",\n    "difficulty": "easy",\n    "question": "Who built the ark?",\n    "answer": "Noah"\n  }\n]`}
                className="w-full rounded-xl text-xs text-[#F0EDD8] outline-none resize-none"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: `1.5px solid ${parseError ? '#C0392B' : 'rgba(245,200,66,0.2)'}`,
                  fontFamily: 'monospace',
                  padding: '14px',
                  minHeight: '280px',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => { if (!parseError) e.target.style.borderColor = '#F5C842' }}
                onBlur={(e) => { if (!parseError) e.target.style.borderColor = 'rgba(245,200,66,0.2)' }}
                spellCheck={false}
              />
              {jsonText && (
                <button
                  onClick={() => { setJsonText(''); setParseError(null) }}
                  className="absolute top-3 right-3 text-[#9BA8C4] hover:text-red-400 transition-colors text-lg leading-none"
                >×</button>
              )}
            </div>

            {/* Character count */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-[#9BA8C4]">{jsonText.length} characters</span>
              {jsonText && (
                <span className="text-[10px] text-[#9BA8C4]">
                  {(() => { try { const a = JSON.parse(jsonText.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')); return Array.isArray(a) ? `${a.length} objects detected` : 'object detected' } catch { return 'not valid JSON yet' } })()}
                </span>
              )}
            </div>

            {parseError && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg mb-4 animate-slide-up" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)' }}>
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-xs text-[#FF8A80] leading-relaxed">{parseError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('prompt')}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9BA8C4' }}
              >
                ← Back
              </button>
              <button
                onClick={handleParse}
                disabled={!jsonText.trim()}
                className="flex-1 py-3 rounded-xl font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
                onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                VALIDATE &amp; PREVIEW →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview & approve ────────────────────────────────────── */}
        {step === 'preview' && validation && (
          <div className="animate-fade-in">
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div>
                <h3 className="font-display text-xl tracking-widest text-[#F0EDD8]">Review Questions</h3>
                <p className="text-xs text-[#9BA8C4] mt-0.5">
                  {validation.valid.length} valid · {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''} · {approved.size} selected
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={approveAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(26,138,74,0.15)', border: '1px solid rgba(26,138,74,0.35)', color: '#6DFFAA' }}>Select all</button>
                <button onClick={rejectAll}  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(192,57,43,0.1)',  border: '1px solid rgba(192,57,43,0.3)',  color: '#FF8A80' }}>Deselect all</button>
              </div>
            </div>

            {/* Saved confirmation */}
            {savedCount !== null && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-5 animate-slide-up" style={{ background: 'rgba(26,138,74,0.15)', border: '1.5px solid rgba(26,138,74,0.5)' }}>
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-[#6DFFAA]">{savedCount} question{savedCount !== 1 ? 's' : ''} added to your bank!</div>
                  <div className="text-xs text-[#9BA8C4] mt-0.5">Go to Browse to see and edit them.</div>
                </div>
                <button onClick={() => { setStep('prompt'); setJsonText(''); setValidation(null); setSavedCount(null) }}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', color: '#F5C842' }}>
                  Import more
                </button>
              </div>
            )}

            {/* Validation errors */}
            {validation.errors.length > 0 && (
              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(192,57,43,0.35)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(192,57,43,0.15)' }}>
                  <span>⚠️</span>
                  <span className="text-xs font-semibold text-[#FF8A80]">{validation.errors.length} item{validation.errors.length !== 1 ? 's' : ''} could not be imported</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(192,57,43,0.2)' }}>
                  {validation.errors.map((e, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <p className="text-[11px] text-[#FF8A80]">
                        {e.index >= 0 ? `Item ${e.index + 1}: ` : ''}{e.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid question cards */}
            <div className="flex flex-col gap-2.5 mb-5">
              {validation.valid.map((q, i) => {
                const ds = DIFF_STYLE[q.difficulty]
                const isApproved = approved.has(i)
                return (
                  <div
                    key={i}
                    onClick={() => toggleApprove(i)}
                    className="group flex items-start gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isApproved ? 'rgba(26,138,74,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isApproved ? 'rgba(26,138,74,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={isApproved
                          ? { background: '#1A8A4A', border: '1.5px solid #1A8A4A' }
                          : { background: 'transparent', border: '1.5px solid rgba(255,255,255,0.2)' }
                        }
                      >
                        {isApproved && <span className="text-[10px] font-bold text-white">✓</span>}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm">{catIcon(q.categoryId)}</span>
                        <span className="text-[10px] text-[#9BA8C4]">{catLabel(q.categoryId)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: ds.color, background: ds.bg, border: `1px solid ${ds.border}` }}>
                          {q.difficulty}
                        </span>
                      </div>

                      <p className="text-sm text-[#F0EDD8] font-medium leading-snug mb-1">{q.question}</p>
                      <p className="text-xs text-[#9BA8C4] leading-snug">
                        <span className="text-[#6DFFAA] font-semibold">A: </span>{q.answer}
                      </p>

                      {/* Category-specific detail */}
                      {q.verseRef && (
                        <p className="text-[10px] text-[#9BA8C4] mt-1">📖 {q.verseRef}</p>
                      )}
                      {q.book && q.chapter && q.verse && (
                        <p className="text-[10px] text-[#9BA8C4] mt-1">📜 {q.book} {q.chapter}:{q.verse}</p>
                      )}
                      {q.isTrue !== undefined && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded"
                          style={q.isTrue ? { background: 'rgba(26,138,74,0.2)', color: '#6DFFAA' } : { background: 'rgba(192,57,43,0.2)', color: '#FF8A80' }}>
                          {q.isTrue ? 'TRUE' : 'FALSE'}
                        </span>
                      )}
                      {q.topicTag && (
                        <span className="inline-block mt-1 mr-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                          style={{ background: 'rgba(123,47,190,0.15)', border: '1px solid rgba(123,47,190,0.3)', color: '#C084FC' }}>
                          🏷️ {q.topicTag}
                        </span>
                      )}
                      {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                        <p className="text-[10px] text-[#9BA8C4] mt-1">{q.acceptableAnswers.length} acceptable answers</p>
                      )}
                    </div>

                    {/* Approve/reject indicator */}
                    <div className="flex-shrink-0 text-xs font-semibold" style={{ color: isApproved ? '#6DFFAA' : '#9BA8C4' }}>
                      {isApproved ? 'Include' : 'Skip'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save bar */}
            {savedCount === null && (
              <div className="sticky bottom-0 pt-3 pb-1" style={{ background: 'linear-gradient(to top, #0A1628 70%, transparent)' }}>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('paste')}
                    className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9BA8C4' }}
                  >
                    ← Edit JSON
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={approved.size === 0}
                    className="flex-1 py-3.5 rounded-xl font-display text-xl tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
                    onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    ADD {approved.size} QUESTION{approved.size !== 1 ? 'S' : ''} →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
