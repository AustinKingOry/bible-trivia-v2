'use client'

import { Field, Textarea, Input } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function CharacterForm({ value, onChange }: Props) {
  // Auto-format question from clues
  const clueText = value.question.replace(/^I [\s\S]+\. Who am I\?$/, '').trim()
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
        <p className="text-[10px] text-muted-foreground mt-1">
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
          style={{ background: 'color-mix(in oklab, var(--primary) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Preview</p>
          <p className="text-sm text-foreground mb-1.5">
            {rawClues}. Who am I?
          </p>
          {value.answer && (
            <p className="text-sm text-success">
              <span className="text-muted-foreground">A: </span>{value.answer}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
