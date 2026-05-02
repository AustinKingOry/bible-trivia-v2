'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export type AuthMode = 'signin' | 'signup' | 'magic'

export interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  signIn:        (email: string, password: string) => Promise<{ error?: string }>
  signUp:        (email: string, password: string) => Promise<{ error?: string }>
  sendMagicLink: (email: string)                   => Promise<{ error?: string }>
  signOut:       ()                                => Promise<void>
  isConfigured:  boolean
}

function fmtError(e: AuthError | null): string | undefined {
  if (!e) return undefined
  // Make common Supabase error messages friendlier
  if (e.message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (e.message.includes('User already registered'))   return 'An account with this email already exists.'
  if (e.message.includes('Email not confirmed'))       return 'Check your inbox to confirm your email first.'
  return e.message
}

export function useAuth(): UseAuthReturn {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const client = getSupabaseClient()
  const isConfigured = client !== null

  useEffect(() => {
    if (!client) { setLoading(false); return }

    // Get initial session
    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [client])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!client) return { error: 'Supabase not configured' }
    const { error } = await client.auth.signInWithPassword({ email, password })
    return { error: fmtError(error) }
  }, [client])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!client) return { error: 'Supabase not configured' }
    const { error } = await client.auth.signUp({ email, password })
    return { error: fmtError(error) }
  }, [client])

  const sendMagicLink = useCallback(async (email: string) => {
    if (!client) return { error: 'Supabase not configured' }
    const { error } = await client.auth.signInWithOtp({ email })
    return { error: fmtError(error) }
  }, [client])

  const signOut = useCallback(async () => {
    if (!client) return
    await client.auth.signOut()
  }, [client])

  return { user, session, loading, signIn, signUp, sendMagicLink, signOut, isConfigured }
}
