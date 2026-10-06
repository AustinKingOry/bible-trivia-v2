'use client'

import Image from 'next/image'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <Image src="/icons/icon-192.png" alt="" width={72} height={72} className="mx-auto mb-6 size-[72px] rounded-2xl" />
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary/15 text-secondary"><WifiOff size={22} /></div>
        <h1 className="font-display text-2xl font-bold">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page hasn&apos;t been saved on this device yet. Sessions and questions you&apos;ve already opened still work, and everything syncs when you&apos;re back online.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/game" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-background">Go to sessions</Link>
          <button onClick={() => location.reload()} className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-surface">Try again</button>
        </div>
      </div>
    </main>
  )
}
