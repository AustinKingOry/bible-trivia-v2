'use client'

import { Field, Textarea, Input } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

export function GeneralForm({ value, onChange }: Props) {
  return (
    <div>
      <Field label="Question" hint="Write a clear, unambiguous question." required>
        <Textarea
          value={value.question}
          onChange={(v) => onChange({ ...value, question: v })}
          placeholder="e.g. How many books are in the Bible?"
          rows={3}
        />
      </Field>

      <Field label="Answer" hint="The correct answer teams must give." required>
        <Textarea
          value={value.answer}
          onChange={(v) => onChange({ ...value, answer: v })}
          placeholder="e.g. 66 books (39 Old Testament, 27 New Testament)"
          rows={2}
        />
      </Field>

      <Field label="Tags (optional)" hint="Comma-separated. e.g. Old Testament, Numbers">
        <Input
          value={(value as any).tags?.join(', ') ?? ''}
          onChange={(v) =>
            onChange({ ...value, tags: v.split(',').map((t) => t.trim()).filter(Boolean) } as any)
          }
          placeholder="Old Testament, History"
        />
      </Field>
    </div>
  )
}
