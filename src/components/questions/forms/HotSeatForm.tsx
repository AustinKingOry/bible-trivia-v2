'use client'

import { useState } from 'react'
import { Field, Input, Textarea } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function HotSeatForm({ value, onChange }: Props) {
  const [answerInput, setAnswerInput] = useState('')
  const hs = value.hotSeatFields ?? { challenge: '', acceptableAnswers: [] }

  const updateHs = (fields: Partial<typeof hs>) => {
    const next = { ...hs, ...fields }
    const question = next.challenge
      ? `${next.challenge.trim()}${next.challenge.trim().endsWith('!') ? '' : '!'} (30 seconds)`
      : value.question
    const answer = next.acceptableAnswers.length
      ? next.acceptableAnswers.join(', ')
      : value.answer
    onChange({ ...value, question, answer, hotSeatFields: next })
  }

  const addAnswer = () => {
    const a = answerInput.trim()
    if (!a || hs.acceptableAnswers.includes(a)) return
    updateHs({ acceptableAnswers: [...hs.acceptableAnswers, a] })
    setAnswerInput('')
  }

  const removeAnswer = (a: string) =>
    updateHs({ acceptableAnswers: hs.acceptableAnswers.filter((x) => x !== a) })

  return (
    <div>
      <Field
        label="Challenge Prompt"
        hint="What must the team list? This is read aloud. Timer starts immediately."
        required
      >
        <Textarea
          value={hs.challenge}
          onChange={(v) => updateHs({ challenge: v })}
          placeholder="Name as many of the 12 disciples of Jesus as you can"
          rows={2}
        />
      </Field>

      <Field
        label="Acceptable Answers"
        hint="Pre-load the answer key for the admin's reference during play. Add one at a time."
      >
        <div className="flex gap-2 mb-3">
          <Input
            value={answerInput}
            onChange={setAnswerInput}
            placeholder="e.g. Peter"
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addAnswer())}
          />
          <button
            type="button"
            onClick={addAnswer}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all shrink-0"
            style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)', color: 'var(--primary)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 28%, transparent)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 15%, transparent)')}
          >
            + Add
          </button>
        </div>

        {hs.acceptableAnswers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hs.acceptableAnswers.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'color-mix(in oklab, var(--success-solid) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--success-solid) 35%, transparent)', color: 'var(--success)' }}
              >
                {a}
                <button
                  onClick={() => removeAnswer(a)}
                  className="text-success/60 hover:text-red-400 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {hs.acceptableAnswers.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 italic">No answers added yet</p>
        )}
      </Field>

      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-muted-foreground"
        style={{ background: 'color-mix(in oklab, var(--secondary) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 25%, transparent)' }}
      >
        <span className="text-base">⏱</span>
        Timer runs for 30 seconds. Admin tracks answers in real time.
      </div>
    </div>
  )
}
