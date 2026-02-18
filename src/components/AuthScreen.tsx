import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error, needsVerification } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else if (needsVerification) {
        setVerificationSent(true)
      }
    }

    setLoading(false)
  }

  if (verificationSent) {
    return (
      <div className="mobile-container flex flex-col bg-background px-6" style={{ minHeight: '100dvh' }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-6">✉️</div>
          <h2
            className="font-serif font-normal text-foreground mb-3"
            style={{ fontSize: '2rem', letterSpacing: '-0.042em' }}
          >
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            Click it to activate your account, then come back to sign in.
          </p>
        </div>
        <div className="pb-10">
          <button
            onClick={() => { setVerificationSent(false); setMode('login') }}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'hsl(var(--nomaya-purple))',
              color: 'hsl(252 75% 97%)',
              boxShadow: '0 4px 32px hsl(252 30% 45% / 0.4)',
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container flex flex-col bg-background" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="px-6 pt-16 pb-8 text-center">
        <h1
          className="font-serif font-normal text-foreground mb-2"
          style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)', letterSpacing: '-0.04em' }}
        >
          Nomaya
        </h1>
        <p className="text-xs text-muted-foreground tracking-[0.25em] uppercase">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive mb-4 px-1">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'hsl(var(--nomaya-purple))',
            color: 'hsl(252 75% 97%)',
            boxShadow: '0 4px 32px hsl(252 30% 45% / 0.4)',
          }}
        >
          {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
            className="text-sm text-muted-foreground"
          >
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <span style={{ color: 'hsl(252 75% 70%)' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
