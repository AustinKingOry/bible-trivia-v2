import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bible Trivia | Game Control',
  description: 'Offline-first Bible Trivia Game Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A1628]">{children}</body>
    </html>
  )
}
