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
        .select('referred_by')
        .eq('id', user.id)
        .single()

      if (me?.referred_by) throw new Error('Already applied')

      // Social reward only, deliberately no money — see Clara's 2026-08-28
      // note. Setting referred_by here fires the notify_referrer_on_signup
      // trigger, which pushes "X joined with your invite 💜" to the referrer.
      const { error: e1 } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', user.id)
      if (e1) throw e1

      return { referrerId: referrer.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
