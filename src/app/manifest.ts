import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TriviaPath',
    short_name: 'TriviaPath',
    description: 'Run live Bible trivia sessions: teams, rounds, scoring and questions, fully offline.',
    start_url: '/game?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#0f1a16',
    theme_color: '#059669',
    categories: ['education', 'games', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Game sessions', url: '/game', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Image game', url: '/image-game', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Questions', url: '/questions', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
