import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { App as CapacitorApp } from '@capacitor/app'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  isPasswordRecovery: boolean
  clearPasswordRecovery: () => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsVerification: boolean }>
  confirmSignUp: (email: string, code: string) => Promise<{ error: Error | null }>
  resendSignupCode: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Parses the `nomaya://reset-password?...` (or `#...`) deep link Supabase
// redirects to after the user taps the email link, and establishes the
// recovery session from whichever token shape it contains — PKCE (`code`)
// or implicit (`access_token`/`refresh_token`).
async function handleAuthDeepLink(url: string): Promise<boolean> {
  if (!url.includes('reset-password')) return false

  const combined = url.replace('#', '?').split('?').slice(1).join('&')
  const params = new URLSearchParams(combined)

  const code = params.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return !error
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    return !error
  }

  return false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // getSession() only reads the locally cached token — it doesn't confirm
      // the underlying account still exists server-side. A stale/orphaned
      // session (e.g. the account was deleted) would otherwise pass this
      // truthiness check and drop straight into onboarding instead of login.
      // getUser() round-trips to the server to verify; on a definitive auth
      // rejection we sign out, but on a network/retryable error (including a
      // thrown one) we fail open and keep the cached session, so a flaky
      // connection on launch doesn't spuriously log a real user out.
      if (session) {
        try {
          // A hard timeout so a hung/very slow connection on launch can't
          // leave the app stuck on the loading screen forever — fail open
          // and proceed with the cached session if the check doesn't
          // complete quickly.
          const { error } = await Promise.race([
            supabase.auth.getUser(),
            new Promise<{ error: null }>((resolve) => setTimeout(() => resolve({ error: null }), 5000)),
          ])
          if (error && !isAuthRetryableFetchError(error)) {
            await supabase.auth.signOut()
            setSession(null)
            setLoading(false)
            return
          }
        } catch {
          // network error — proceed with the cached session
        }
      }
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
    })

    const urlListener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.includes('reset-password')) {
        const ok = await handleAuthDeepLink(url)
        if (ok) setIsPasswordRecovery(true)
      }
    })

    return () => {
      subscription.unsubscribe()
      urlListener.then(l => l.remove())
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return {
      error: error as Error | null,
      needsVerification: !!data.user && !data.session,
    }
  }

  // Confirms the 6-digit code from the "Confirm signup" email (type: 'signup'
  // OTP token) — an alternative to clicking the confirmation link, which
  // establishes a session directly, same as the link flow would.
  const confirmSignUp = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    return { error: error as Error | null }
  }

  const resendSignupCode = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'nomaya://reset-password',
    })
    return { error: error as Error | null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, loading,
      isPasswordRecovery, clearPasswordRecovery: () => setIsPasswordRecovery(false),
      signIn, signUp, confirmSignUp, resendSignupCode, signOut, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
