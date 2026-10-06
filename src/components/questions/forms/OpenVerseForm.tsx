'use client'

import { Field, Input, Textarea } from './FormFields'
import type { FormPayload } from '../AddQuestionDrawer'

interface Props {
  value: Omit<FormPayload, 'difficulty'>
  onChange: (v: Omit<FormPayload, 'difficulty'>) => void
}

const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
  '1 John','2 John','3 John','Jude','Revelation',
]

export function OpenVerseForm({ value, onChange }: Props) {
  const ov = value.openVerseFields ?? { book: '', chapter: 1, verse: 1, verseText: '' }

  const update = (fields: Partial<typeof ov>) => {
    const next = { ...ov, ...fields }
    const ref = next.book ? `${next.book} ${next.chapter}:${next.verse}` : ''
    const question = ref ? `Open your Bible to ${ref}. What does this verse say?` : value.question
    const answer = next.verseText ? `"${next.verseText}"` : value.answer
    onChange({ ...value, question, answer, openVerseFields: next })
  }

  const ref = ov.book ? `${ov.book} ${ov.chapter}:${ov.verse}` : ''

  return (
    <div>
      <Field label="Book" required>
        <div className="relative">
          <select
            value={ov.book}
            onChange={(e) => update({ book: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden appearance-none"
            style={{
              background: 'color-mix(in oklab, var(--foreground) 6%, transparent)',
              border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="" style={{ background: 'var(--card)' }}>Select a book...</option>
            {BOOKS.map((b) => (
              <option key={b} value={b} style={{ background: 'var(--card)' }}>{b}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">▾</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Chapter" required>
          <Input
            type="number"
            min="1"
            value={String(ov.chapter)}
            onChange={(v) => update({ chapter: Math.max(1, parseInt(v) || 1) })}
            placeholder="1"
          />
        </Field>
        <Field label="Verse" required>
          <Input
            type="number"
            min="1"
            value={String(ov.verse)}
            onChange={(v) => update({ verse: Math.max(1, parseInt(v) || 1) })}
            placeholder="1"
          />
        </Field>
      </div>

      <Field
        label="Verse Text (answer key)"
        hint="Type the full verse text for the admin's reference."
        required
      >
        <Textarea
          value={ov.verseText}
          onChange={(v) => update({ verseText: v })}
          placeholder="In the beginning God created the heavens and the earth."
          rows={3}
        />
      </Field>

      {/* Live preview */}
      {ref && (
        <div
          className="rounded-lg p-3 mt-1"
          style={{ background: 'color-mix(in oklab, var(--primary) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Preview</p>
          <p className="text-sm text-foreground mb-1.5">
            Open your Bible to <span className="text-primary font-semibold">{ref}</span>. What does this verse say?
          </p>
          {ov.verseText && (
            <p className="text-sm text-success italic">&ldquo;{ov.verseText}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  )
}
