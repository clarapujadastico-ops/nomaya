import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/** Apply a referral code for the current user (call once during onboarding) */
export function useApplyReferral() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      const trimmed = code.trim().toUpperCase()
      if (!trimmed || !user) throw new Error('Invalid')

      // Find the referrer by their referral_code
      const { data: referrer, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', trimmed)
        .neq('id', user.id)
        .maybeSingle()

      if (findError || !referrer) throw new Error('Code not found')

      // Check not already referred
      const { data: me } = await supabase
        .from('profiles')
        .select('credits_cents, referred_by')
        .eq('id', user.id)
        .single()

      if (me?.referred_by) throw new Error('Already applied')

      // Mark current user as referred + give €10 credit (valid 14 days) + priority verification flag
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const { error: e1 } = await supabase
        .from('profiles')
        .update({
          referred_by: referrer.id,
          credits_cents: (me?.credits_cents ?? 0) + 1000,
          referral_credit_expires_at: expiresAt,
        })
        .eq('id', user.id)
      if (e1) throw e1

      return { referrerId: referrer.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
