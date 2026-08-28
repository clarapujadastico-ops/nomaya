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

      // Track who referred this user and award the new user's €10 signup
      // credit immediately. The referrer's €5 is awarded separately, on the
      // new user's first event attendance (reward_referrer_on_first_attendance
      // trigger on event_attendance).
      const { error: e1 } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id, credits_cents: (me?.credits_cents ?? 0) + 1000 })
        .eq('id', user.id)
      if (e1) throw e1

      return { referrerId: referrer.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
