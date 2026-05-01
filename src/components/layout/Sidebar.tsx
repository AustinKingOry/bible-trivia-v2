'use client'

import Link from 'next/link'
import { SyncIndicator } from '@/components/layout/SyncIndicator'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'

const NAV = [
  {
    href: '/game',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M9 11l3-3 3 3"/><path d="M12 8v6"/>
      </svg>
    ),
    label: 'Game',
    description: 'Sessions & play',
  },
  {
    href: '/questions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    label: 'Questions',
    description: 'Manage & add',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const customCount = useGameStore((s) => Object.keys(s.customQuestions).length)

  const isActive = (href: string) => {
    if (href === '/game') return pathname === '/game' || pathname.startsWith('/game/')
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="flex flex-col w-[72px] lg:w-56 flex-shrink-0 h-screen border-r"
      style={{ background: '#0D1E38', borderColor: 'rgba(245,200,66,0.15)' }}
    >
      {/* Logo */}
      <div className="px-3 lg:px-5 py-4 border-b" style={{ borderColor: 'rgba(245,200,66,0.15)' }}>
        <div className="font-display text-gold-glow tracking-widest text-center lg:text-left">
          <span className="text-xl lg:text-2xl">✝</span>
          <span className="hidden lg:inline text-lg ml-2 text-[#F5C842]">TRIVIA</span>
        </div>
        <p className="hidden lg:block text-[9px] text-[#9BA8C4] tracking-widest mt-0.5 uppercase">Game Control</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg transition-all group"
              style={active
                ? { background: 'rgba(245,200,66,0.12)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.25)' }
                : { color: '#9BA8C4', border: '1px solid transparent' }
              }
              onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block text-sm font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom badge */}
      {customCount > 0 && (
        <div className="px-2 lg:px-4 py-3 border-t hidden lg:block" style={{ borderColor: 'rgba(245,200,66,0.12)' }}>
          <div className="text-[10px] text-[#9BA8C4] uppercase tracking-widest">{customCount} custom question{customCount !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Sync status */}
      <SyncIndicator />

      {/* Version */}
      <div className="px-2 py-2 hidden lg:block">
        <div className="text-[9px] text-[#4A5568] text-center tracking-widest">v3.0 · offline-first + sync</div>
      </div>
    </aside>
  )
}
