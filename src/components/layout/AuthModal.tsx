'use client'

import { useState } from 'react'
import { useAuth, type AuthMode } from '@/hooks/useAuth'

interface Props {
  onClose: () => void
  defaultMode?: AuthMode
}

export function AuthModal({ onClose, defaultMode = 'signin' }: Props) {
  const { signIn, signUp, sendMagicLink } = useAuth()

  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const reset = () => { setError(null); setSuccess(null) }

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required.'); return }
    if (mode !== 'magic' && !password.trim()) { setError('Password is required.'); return }
    setLoading(true); setError(null); setSuccess(null)

    let result: { error?: string } = {}

    if (mode === 'signin')  result = await signIn(email, password)
    if (mode === 'signup')  result = await signUp(email, password)
    if (mode === 'magic')   result = await sendMagicLink(email)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (mode === 'magic') {
      setSuccess('Magic link sent! Check your inbox and click the link to sign in.')
    } else if (mode === 'signup') {
      setSuccess('Account created! Check your inbox to confirm your email.')
    } else {
      // Signed in — close modal
      onClose()
    }
  }

  const modeLabel: Record<AuthMode, string> = {
    signin: 'Sign In',
    signup: 'Create Account',
    magic:  'Magic Link',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-sm rounded-2xl flex flex-col animate-slide-up"
          style={{
            background: '#0D1E38',
            border: '1.5px solid rgba(245,200,66,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b"
            style={{ borderColor: 'rgba(245,200,66,0.18)' }}
          >
            <div>
              <h2 className="font-display text-2xl tracking-widest text-gold-glow">
                {modeLabel[mode].toUpperCase()}
              </h2>
              <p className="text-[11px] text-[#9BA8C4] mt-0.5">
                {mode === 'signin' && 'Sign in to sync your data to the cloud'}
                {mode === 'signup' && 'Create an account to save and sync your data'}
                {mode === 'magic'  && 'Get a one-click sign-in link via email'}
              </p>
            </div>
            <button onClick={onClose} className="text-[#9BA8C4] hover:text-white text-2xl transition-colors">×</button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(245,200,66,0.2)' }}>
              {(['signin', 'signup', 'magic'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); reset() }}
                  className="flex-1 py-2 text-xs font-semibold transition-all"
                  style={mode === m
                    ? { background: 'rgba(245,200,66,0.15)', color: '#F5C842' }
                    : { color: '#9BA8C4' }
                  }
                >
                  {modeLabel[m]}
                </button>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); reset() }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(245,200,66,0.25)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
              />
            </div>

            {/* Password (not shown for magic link) */}
            {mode !== 'magic' && (
              <div>
                <label className="text-[10px] font-semibold tracking-widest text-[#9BA8C4] uppercase block mb-1.5">
                  Password {mode === 'signup' && <span className="normal-case text-[#4A5568]">(min 6 characters)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); reset() }}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(245,200,66,0.25)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.25)')}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg animate-slide-up"
                style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)' }}
              >
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-xs text-[#FF8A80] leading-relaxed">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg animate-slide-up"
                style={{ background: 'rgba(26,138,74,0.15)', border: '1px solid rgba(26,138,74,0.4)' }}
              >
                <span className="text-base flex-shrink-0">✉️</span>
                <p className="text-xs text-[#6DFFAA] leading-relaxed">{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display text-xl tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#F5C842,#C49A10)', color: '#0A1628' }}
              onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.88' }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {loading ? '…' : mode === 'signin' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND LINK'}
            </button>

            {/* Privacy note */}
            <p className="text-center text-[10px] text-[#4A5568] leading-relaxed">
              Your data stays local even without an account.{' '}
              Signing in enables cloud sync and backup.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
