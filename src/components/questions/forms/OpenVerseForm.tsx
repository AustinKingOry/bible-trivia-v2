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
            className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none appearance-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(245,200,66,0.2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="" style={{ background: '#142240' }}>Select a book...</option>
            {BOOKS.map((b) => (
              <option key={b} value={b} style={{ background: '#142240' }}>{b}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BA8C4] pointer-events-none">▾</span>
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
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <p className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase mb-2">Preview</p>
          <p className="text-sm text-[#F0EDD8] mb-1.5">
            Open your Bible to <span className="text-[#F5C842] font-semibold">{ref}</span>. What does this verse say?
          </p>
          {ov.verseText && (
            <p className="text-sm text-[#6DFFAA] italic">&ldquo;{ov.verseText}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  )
}
