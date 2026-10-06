'use client'

import { useState, useRef, useCallback } from 'react'
import { JsonImportPanel } from './JsonImportPanel'
import type { PdfUploadJob } from '@/types'

function uid() { return `job_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }

type ImportTab = 'json' | 'pdf'

// ─── Main panel — tabs: JSON import (primary) + PDF upload (stub) ─────────────
export function PdfUploadPanel() {
  const [importTab, setImportTab] = useState<ImportTab>('json')

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex gap-1 px-6 pt-4 pb-0 shrink-0">
        <SubTab
          active={importTab === 'json'}
          onClick={() => setImportTab('json')}
          icon="{ }"
          label="Paste JSON"
          badge="Recommended"
          badgeColor="var(--success)"
        />
        <SubTab
          active={importTab === 'pdf'}
          onClick={() => setImportTab('pdf')}
          icon="📄"
          label="PDF Upload"
          badge="Coming soon"
          badgeColor="var(--muted-foreground)"
        />
      </div>

      {/* Divider */}
      <div className="mx-6 mt-3 mb-0 h-px" style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)' }} />

      {importTab === 'json' ? <JsonImportPanel /> : <PdfUploadStub />}
    </div>
  )
}

// ─── Sub-tab button ───────────────────────────────────────────────────────────
function SubTab({ active, onClick, icon, label, badge, badgeColor }: {
  active: boolean; onClick: () => void
  icon: string; label: string; badge: string; badgeColor: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all"
      style={active
        ? { background: 'var(--card)', color: 'var(--primary)', borderTop: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)', borderLeft: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)', borderRight: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)' }
        : { color: 'var(--muted-foreground)' }
      }
    >
      <span className="font-mono text-base">{icon}</span>
      {label}
      <span
        className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wide"
        style={{ background: `color-mix(in oklab, ${badgeColor} 13%, transparent)`, color: badgeColor, border: `1px solid color-mix(in oklab, ${badgeColor} 27%, transparent)` }}
      >
        {badge}
      </span>
    </button>
  )
}

// ─── PDF upload stub (unchanged functionality) ────────────────────────────────
function PdfUploadStub() {
  const [jobs, setJobs] = useState<PdfUploadJob[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    if (!pdfs.length) return

    const newJobs: PdfUploadJob[] = pdfs.map((f) => ({
      id: uid(), filename: f.name, status: 'pending', createdAt: Date.now(),
    }))
    setJobs((prev) => [...newJobs, ...prev])

    newJobs.forEach((job) => {
      setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, status: 'processing' } : j)), 800)
      setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id
        ? { ...j, status: 'error', error: 'AI backend not connected. Use JSON import in the meantime.' }
        : j)), 3200)
    })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const STATUS_COLOR: Record<PdfUploadJob['status'], string> = {
    pending: 'var(--muted-foreground)', processing: 'var(--primary)', done: 'var(--success)', error: 'var(--danger)',
  }
  const STATUS_ICON: Record<PdfUploadJob['status'], string> = {
    pending: '⏳', processing: '⚙️', done: '✅', error: '❌',
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl mx-auto w-full">
      {/* Notice */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
        style={{ background: 'color-mix(in oklab, var(--secondary) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--secondary) 30%, transparent)' }}>
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-xs font-semibold text-secondary mb-0.5">Backend not connected yet</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PDF auto-extraction requires a server endpoint. In the meantime, upload your PDF to Claude or ChatGPT,
            use the <strong className="text-foreground">Paste JSON</strong> tab to import the output.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current?.click()}
        className="rounded-2xl flex flex-col items-center justify-center py-14 px-8 text-center cursor-pointer transition-all mb-6"
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : 'color-mix(in oklab, var(--primary) 25%, transparent)'}`,
          background: dragging ? 'color-mix(in oklab, var(--primary) 5%, transparent)' : 'color-mix(in oklab, var(--foreground) 2%, transparent)',
          transform: dragging ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf" multiple className="sr-only"
          onChange={(e) => handleFiles(e.target.files)} />
        <div className="text-5xl mb-4">{dragging ? '📂' : '📄'}</div>
        <p className="text-foreground font-semibold mb-1">{dragging ? 'Drop to queue' : 'Drop PDFs here or click to browse'}</p>
        <p className="text-muted-foreground text-xs mb-6">Supports .pdf · Max 20 MB per file</p>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'color-mix(in oklab, var(--primary) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)', color: 'var(--primary)' }}>
          <span>📤</span> Choose Files
        </div>
      </div>

      {/* Job queue */}
      {jobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Queue</h3>
            <button onClick={() => setJobs([])} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">Clear all</button>
          </div>
          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 px-4 py-3 rounded-lg animate-slide-up"
                style={{ background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: `1px solid color-mix(in oklab, ${STATUS_COLOR[job.status]} 20%, transparent)` }}>
                <span className="text-xl shrink-0">{STATUS_ICON[job.status]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{job.filename}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase shrink-0"
                      style={{ background: `color-mix(in oklab, ${STATUS_COLOR[job.status]} 13%, transparent)`, color: STATUS_COLOR[job.status] }}>
                      {job.status}
                    </span>
                  </div>
                  {job.status === 'error' && job.error && (
                    <p className="text-[10px] text-danger mt-0.5">{job.error}</p>
                  )}
                </div>
                <button onClick={() => setJobs((p) => p.filter((j) => j.id !== job.id))}
                  className="text-muted-foreground hover:text-red-400 text-lg transition-colors">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}