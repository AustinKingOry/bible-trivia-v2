'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'

const OPTS = [['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']] as const

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className={compact ? 'h-9 w-9' : 'h-10'} />
  const next = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  if (compact) {
    const [, Icon, label] = OPTS.find(([v]) => v === theme) ?? OPTS[2]
    return (
      <button onClick={next} aria-label={`Theme: ${label}. Tap to change`}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
        <Icon size={18} />
      </button>
    )
  }
  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-xl bg-surface p-1">
      {OPTS.map(([v, Icon, label]) => (
        <button key={v} role="radio" aria-checked={theme === v} aria-label={label} onClick={() => setTheme(v)}
          className={`grid h-8 flex-1 place-items-center rounded-lg transition-colors ${theme === v ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}
