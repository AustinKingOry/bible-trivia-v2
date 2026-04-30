'use client'

import { Field, Textarea, Input } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function CharacterForm({ value, onChange }: Props) {
  // Auto-format question from clues
  const clueText = value.question.replace(/^I .+\. Who am I\?$/s, '').trim()
    || value.question.replace('Who am I?', '').trim()

  const updateClues = (clues: string) => {
    // Format as first-person clue
    const formatted = clues.trim()
      ? `${clues.trim()}${clues.trim().endsWith('.') ? '' : '.'} Who am I?`
      : ''
    onChange({ ...value, question: formatted })
  }

  const rawClues = value.question.replace(/\s*Who am I\?$/, '').trim()

  return (
    <div>
      <Field
        label="Character Clues"
        hint="Write in first person ('I was...', 'I had...'). The team must name the character."
        required
      >
        <Textarea
          value={rawClues}
          onChange={updateClues}
          placeholder={"I was a shepherd boy who defeated a giant named Goliath with a sling and a stone."}
          rows={4}
        />
        <p className="text-[10px] text-[#9BA8C4] mt-1">
          &ldquo;Who am I?&rdquo; is added automatically.
        </p>
      </Field>

      <Field label="Character Name (answer)" required>
        <Input
          value={value.answer}
          onChange={(v) => onChange({ ...value, answer: v })}
          placeholder="David"
        />
      </Field>

      {/* Live preview */}
      {rawClues && (
        <div
          className="rounded-lg p-3 mt-1"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-2">Preview</p>
          <p className="text-sm text-[#F0EDD8] mb-1.5">
            {rawClues}. Who am I?
          </p>
          {value.answer && (
            <p className="text-sm text-[#6DFFAA]">
              <span className="text-[#9BA8C4]">A: </span>{value.answer}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
