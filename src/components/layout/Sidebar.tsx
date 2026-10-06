'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Download, Gamepad2, ImageIcon, LibraryBig } from 'lucide-react'
import { usePwa } from '@/hooks/usePwa'
import { SyncIndicator } from '@/components/layout/SyncIndicator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useGameStore } from '@/store/gameStore'

const NAV = [
  { href: '/game', icon: Gamepad2, label: 'Game', description: 'Sessions & play' },
  { href: '/image-game', icon: ImageIcon, label: 'Image Game', description: 'Identify images' },
  { href: '/questions', icon: LibraryBig, label: 'Questions', description: 'Manage & add' },
]

// Live gameplay screens need every pixel on a phone, so the bottom bar steps aside there.
const IMMERSIVE = /\/session\/[^/]+\/game\/|\/play\//

function Brand() {
  return (
    <Link href="/game" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
      <span className="font-display text-lg font-bold">Trivia<span className="text-primary">Path</span></span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const customCount = useGameStore((s) => Object.keys(s.customQuestions).length)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/') || (href === '/game' && pathname.startsWith('/session/'))
  const immersive = IMMERSIVE.test(pathname)
  const { canInstall, install } = usePwa()

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <div className="flex h-12 items-center"><Brand /></div>
        <ThemeToggle compact />
      </header>

      {/* Tablet / desktop rail */}
      <aside className="hidden h-dvh w-[72px] shrink-0 flex-col border-r bg-sidebar md:flex lg:w-60">
        <div className="flex h-16 items-center justify-center border-b px-3 lg:justify-start lg:px-5">
          <span className="lg:hidden"><Image src="/logo.png" alt="TriviaPath" width={32} height={32} className="size-8 rounded-lg" /></span>
          <span className="hidden lg:block"><Brand /></span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 lg:p-3" aria-label="Main">
          {NAV.map(({ href, icon: Icon, label, description }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} title={label} aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 transition-colors lg:justify-start ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface hover:text-foreground'}`}>
                <Icon size={20} className="shrink-0" />
                <span className="hidden lg:block">
                  <span className="block text-sm font-semibold leading-tight">{label}</span>
                  <span className="block text-[11px] font-normal opacity-70">{description}</span>
                </span>
              </Link>
            )
          })}
        </nav>
        {customCount > 0 && (
          <div className="hidden border-t px-5 py-3 text-xs text-muted-foreground lg:block">
            {customCount} custom question{customCount !== 1 ? 's' : ''}
          </div>
        )}
        <SyncIndicator />
        {canInstall && (
          <button onClick={install} title="Install app"
            className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 lg:mx-3">
            <Download size={18} className="shrink-0" /><span className="hidden lg:inline">Install app</span>
          </button>
        )}
        <div className="p-2 lg:p-3"><div className="hidden lg:block"><ThemeToggle /></div><div className="flex justify-center lg:hidden"><ThemeToggle compact /></div></div>
      </aside>

      {/* Mobile bottom tab bar */}
      {!immersive && (
        <nav aria-label="Main" className="shrink-0 border-t bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
          <ul className="grid grid-cols-3">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link href={href} aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Icon size={22} />{label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </>
  )
}
