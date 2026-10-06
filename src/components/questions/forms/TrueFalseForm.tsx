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
          <p className="text-[10px] text-muted-foreground mt-1">
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
                ? { background: 'color-mix(in oklab, var(--success-solid) 25%, transparent)', border: '2.5px solid var(--success-solid)', color: 'var(--success)', boxShadow: '0 0 20px color-mix(in oklab, var(--success-solid) 30%, transparent)' }
                : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '2.5px solid color-mix(in oklab, var(--foreground) 10%, transparent)', color: 'var(--muted-foreground)' }
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
                ? { background: 'color-mix(in oklab, var(--danger-solid) 25%, transparent)', border: '2.5px solid var(--danger-solid)', color: 'var(--danger)', boxShadow: '0 0 20px color-mix(in oklab, var(--danger-solid) 30%, transparent)' }
                : { background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '2.5px solid color-mix(in oklab, var(--foreground) 10%, transparent)', color: 'var(--muted-foreground)' }
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
          style={{ background: 'color-mix(in oklab, var(--primary) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Preview</p>
          <p className="text-sm text-foreground mb-2">True or False: {tf.statement}</p>
          <div className="flex items-start gap-2">
            <span
              className="px-2.5 py-1 rounded-sm font-display text-base tracking-wide shrink-0"
              style={
                tf.isTrue
                  ? { background: 'color-mix(in oklab, var(--success-solid) 20%, transparent)', color: 'var(--success)' }
                  : { background: 'color-mix(in oklab, var(--danger-solid) 20%, transparent)', color: 'var(--danger)' }
              }
            >
              {tf.isTrue ? 'TRUE' : 'FALSE'}
            </span>
            {tf.explanation && (
              <span className="text-xs text-muted-foreground leading-relaxed">{tf.explanation}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}