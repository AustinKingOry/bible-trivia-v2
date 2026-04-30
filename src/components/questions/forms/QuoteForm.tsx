'use client'

import { useEffect } from 'react'
import { Field, Input, Textarea } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function QuoteForm({ value, onChange }: Props) {
  const qf = value.quoteFields ?? { verseRef: '', partialVerse: '', completion: '' }

  const update = (fields: Partial<typeof qf>) => {
    const next = { ...qf, ...fields }
    // Auto-generate question and answer from structured fields
    const question = next.partialVerse
      ? `Complete: "${next.partialVerse}${next.partialVerse.endsWith('...') ? '' : '...'}"`
      : value.question
    const answer = next.completion
      ? `${next.completion}${next.verseRef ? ` (${next.verseRef})` : ''}`
      : value.answer
    onChange({ ...value, question, answer, quoteFields: next })
  }

  return (
    <div>
      <Field label="Verse Reference" hint="e.g. John 3:16" required>
        <Input
          value={qf.verseRef}
          onChange={(v) => update({ verseRef: v })}
          placeholder="John 3:16"
        />
      </Field>

      <Field
        label="Partial Verse (shown to teams)"
        hint="Write the verse up to the break point. End with '...' to mark the cut."
        required
      >
        <Textarea
          value={qf.partialVerse}
          onChange={(v) => update({ partialVerse: v })}
          placeholder="For God so loved the world that He gave His only begotten Son, that whoever believes in Him shall not perish but..."
          rows={3}
        />
      </Field>

      <Field label="Expected Completion (answer)" hint="What the team must say to score." required>
        <Input
          value={qf.completion}
          onChange={(v) => update({ completion: v })}
          placeholder="have eternal life"
        />
      </Field>

      {/* Live preview */}
      {(qf.partialVerse || qf.completion) && (
        <div
          className="rounded-lg p-3 mt-2"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-2">Preview</p>
          {qf.partialVerse && (
            <p className="text-sm text-[#F0EDD8] mb-2">
              <span className="text-[#9BA8C4]">Q: </span>
              Complete: &ldquo;{qf.partialVerse}&rdquo;
            </p>
          )}
          {qf.completion && (
            <p className="text-sm text-[#6DFFAA]">
              <span className="text-[#9BA8C4]">A: </span>
              {qf.completion}{qf.verseRef && ` (${qf.verseRef})`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
