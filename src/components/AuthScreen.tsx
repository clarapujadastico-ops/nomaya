import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LanguageContext'

export function AuthScreen() {
  const { signIn, signUp, confirmSignUp, resendSignupCode, resetPassword } = useAuth()
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [codeResent, setCodeResent] = useState(false)

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

  const handleResetRequest = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    const { error } = await resetPassword(email)
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (verificationSent) {
    const handleConfirm = async () => {
      if (otpCode.trim().length < 6) return
      setConfirming(true)
      setConfirmError(null)
      const { error } = await confirmSignUp(email, otpCode.trim())
      if (error) setConfirmError(error.message)
      setConfirming(false)
    }
    const handleResend = async () => {
      setConfirmError(null)
      const { error } = await resendSignupCode(email)
      if (!error) {
        setCodeResent(true)
        setTimeout(() => setCodeResent(false), 4000)
      } else {
        setConfirmError(error.message)
      }
    }
    return (
      <div className="mobile-container flex flex-col bg-background px-6" style={{ minHeight: '100dvh' }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-6">✉️</div>
          <h2
            className="font-serif font-normal text-foreground mb-3"
            style={{ fontSize: '2rem', letterSpacing: '-0.042em' }}
          >
            {t('auth.otp_title')}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
            {t('auth.otp_body')} <strong className="text-foreground">{email}</strong>. {t('auth.otp_cta')}
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={otpCode}
            onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setConfirmError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className="w-full max-w-[200px] px-4 py-3.5 rounded-xl border border-input bg-card text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
          />
          {confirmError && <p className="text-xs text-destructive mt-3">{confirmError}</p>}
          {codeResent && <p className="text-xs text-muted-foreground mt-3">{t('auth.otp_resent')}</p>}
        </div>
        <div className="pb-10 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={confirming || otpCode.trim().length < 6}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'hsl(var(--nomaya-purple))',
              color: 'hsl(252 75% 97%)',
              boxShadow: '0 4px 32px hsl(252 30% 45% / 0.4)',
            }}
          >
            {confirming ? t('auth.otp_verifying') : t('auth.otp_confirm')}
          </button>
          <button onClick={handleResend} className="w-full py-2 text-sm text-muted-foreground">
            {t('auth.otp_resend')}
          </button>
          <button
            onClick={() => { setVerificationSent(false); setMode('login'); setOtpCode(''); setConfirmError(null) }}
            className="w-full py-2 text-xs text-muted-foreground/70"
          >
            {t('auth.back_signin')}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'forgot') {
    if (resetSent) {
      return (
        <div className="mobile-container flex flex-col bg-background px-6" style={{ minHeight: '100dvh' }}>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-6">✉️</div>
            <h2
              className="font-serif font-normal text-foreground mb-3"
              style={{ fontSize: '2rem', letterSpacing: '-0.042em' }}
            >
              {t('auth.reset_sent_title')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('auth.reset_sent_body')} <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
          <div className="pb-10">
            <button
              onClick={() => { setResetSent(false); setMode('login'); setError(null) }}
              className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'hsl(var(--nomaya-purple))',
                color: 'hsl(252 75% 97%)',
                boxShadow: '0 4px 32px hsl(252 30% 45% / 0.4)',
              }}
            >
              {t('auth.back_to_login')}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="mobile-container flex flex-col bg-background" style={{ minHeight: '100dvh' }}>
        <div className="px-6 pt-16 pb-8 text-center">
          <h1
            className="font-serif font-normal text-foreground mb-2"
            style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)', letterSpacing: '-0.04em' }}
          >
            Nomaya
          </h1>
          <p className="text-xs text-muted-foreground tracking-[0.25em] uppercase">
            {t('auth.reset_title')}
          </p>
        </div>

        <div className="flex-1 px-6">
          <p className="text-sm text-muted-foreground mb-6">{t('auth.reset_sub')}</p>
          <div className="mb-6">
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              {t('auth.email')}
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResetRequest()}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>

          {error && <p className="text-xs text-destructive mb-4 px-1">{error}</p>}

          <button
            onClick={handleResetRequest}
            disabled={loading || !email}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'hsl(var(--nomaya-purple))',
              color: 'hsl(252 75% 97%)',
              boxShadow: '0 4px 32px hsl(252 30% 45% / 0.4)',
            }}
          >
            {loading ? t('auth.sending') : t('auth.reset_send')}
          </button>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className="text-sm text-muted-foreground"
            >
              {t('auth.back_to_login')}
            </button>
          </div>
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
          {mode === 'login' ? t('auth.welcome_back') : t('auth.create_account_sub')}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              {t('auth.email')}
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
              {t('auth.password')}
            </label>
            <input
              type="password"
              placeholder={mode === 'signup' ? t('auth.password_hint') : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
            {mode === 'login' && (
              <button
                onClick={() => { setMode('forgot'); setError(null) }}
                className="text-xs mt-2 block"
                style={{ color: 'hsl(252 75% 70%)' }}
              >
                {t('auth.forgot_password')}
              </button>
            )}
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
          {loading ? '...' : mode === 'login' ? t('auth.sign_in') : t('auth.sign_up')}
        </button>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
            className="text-sm text-muted-foreground"
          >
            {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}{' '}
            <span style={{ color: 'hsl(252 75% 70%)' }}>
              {mode === 'login' ? t('auth.sign_up') : t('auth.sign_in')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
