'use client'

import { Field, Textarea, Input } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function TrueFalseForm({ value, onChange }: Props) {
  const tf = value.trueFalseFields ?? { statement: '', isTrue: true, explanation: '' }

  const update = (fields: Partial<typeof tf>) => {
    const next = { ...tf, ...fields }
    const question = next.statement
      ? `True or False: ${next.statement.trim()}`
      : value.question
    const answer = next.statement
      ? `${next.isTrue ? 'TRUE' : 'FALSE'}${next.explanation ? ` — ${next.explanation}` : ''}`
      : value.answer
    onChange({ ...value, question, answer, trueFalseFields: next })
  }

  return (
    <div>
      <Field
        label="Statement"
        hint="Write a declarative statement — teams decide if it is TRUE or FALSE."
        required
      >
        <Textarea
          value={tf.statement}
          onChange={(v) => update({ statement: v })}
          placeholder="The Bible says money is the root of all evil."
          rows={3}
        />
        {tf.statement && (
          <p className="text-[10px] text-[#9BA8C4] mt-1">
            Will be shown as: <em>True or False: {tf.statement}</em>
          </p>
        )}
      </Field>

      {/* TRUE / FALSE toggle — big, tactile, game-show style */}
      <Field label="Correct Answer" required>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ isTrue: true })}
            className="py-5 rounded-xl font-display text-2xl tracking-widest transition-all"
            style={
              tf.isTrue
                ? { background: 'rgba(26,138,74,0.25)', border: '2.5px solid #1A8A4A', color: '#6DFFAA', boxShadow: '0 0 20px rgba(26,138,74,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', border: '2.5px solid rgba(255,255,255,0.1)', color: '#9BA8C4' }
            }
          >
            ✓ TRUE
          </button>
          <button
            type="button"
            onClick={() => update({ isTrue: false })}
            className="py-5 rounded-xl font-display text-2xl tracking-widest transition-all"
            style={
              !tf.isTrue
                ? { background: 'rgba(192,57,43,0.25)', border: '2.5px solid #C0392B', color: '#FF8A80', boxShadow: '0 0 20px rgba(192,57,43,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', border: '2.5px solid rgba(255,255,255,0.1)', color: '#9BA8C4' }
            }
          >
            ✗ FALSE
          </button>
        </div>
      </Field>

      <Field
        label="Explanation (shown after answer)"
        hint="Why is this true or false? Add a scripture reference."
      >
        <Input
          value={tf.explanation}
          onChange={(v) => update({ explanation: v })}
          placeholder='1 Timothy 6:10 says "the LOVE of money" is the root of all evil.'
        />
      </Field>

      {/* Live preview */}
      {tf.statement && (
        <div
          className="rounded-lg p-3 mt-1"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-2">Preview</p>
          <p className="text-sm text-[#F0EDD8] mb-2">True or False: {tf.statement}</p>
          <div className="flex items-start gap-2">
            <span
              className="px-2.5 py-1 rounded font-display text-base tracking-wide flex-shrink-0"
              style={
                tf.isTrue
                  ? { background: 'rgba(26,138,74,0.2)', color: '#6DFFAA' }
                  : { background: 'rgba(192,57,43,0.2)', color: '#FF8A80' }
              }
            >
              {tf.isTrue ? 'TRUE' : 'FALSE'}
            </span>
            {tf.explanation && (
              <span className="text-xs text-[#9BA8C4] leading-relaxed">{tf.explanation}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}