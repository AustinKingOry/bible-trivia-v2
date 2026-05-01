'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Tone identifiers mapped to files in /public/tones/
 * File names must match exactly what you place in /public/tones/
 */
export type ToneKey =
  | 'correct'     // correct answer
  | 'wrong'       // wrong answer
  | 'pass'        // team passes
  | 'timeout'     // answer/steal timer expires
  | 'complete'    // round or hot-seat session ends

const TONE_FILES: Record<ToneKey, string> = {
  correct:  '/tones/correct.mp3',
  wrong:    '/tones/wrong.mp3',
  pass:     '/tones/pass.mp3',
  timeout:  '/tones/timeout.mp3',
  complete: '/tones/complete.mp3',
}

export function useTones() {
  // Single shared Audio element — only one plays at a time
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Track whether we're in a browser environment
  const canPlayRef = useRef(false)

  useEffect(() => {
    canPlayRef.current = typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }, [])

  const play = useCallback((tone: ToneKey) => {
    if (!canPlayRef.current) return

    const src = TONE_FILES[tone]

    // Stop and reset whatever is currently playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    // Reuse the element if same src, create new one if different
    if (!audioRef.current || audioRef.current.src !== window.location.origin + src) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audioRef.current = audio
    }

    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {
      // Autoplay may be blocked before first user interaction — silently ignore
    })
  }, [])

  // Stop any playing tone (e.g. on unmount or round end)
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  // Preload all tones on mount so first play is instant
  useEffect(() => {
    if (!canPlayRef.current) return
    Object.values(TONE_FILES).forEach((src) => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      // Just creating + setting preload is enough to prime the browser cache
    })
  }, [])

  // Stop on unmount
  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { play, stop }
}
