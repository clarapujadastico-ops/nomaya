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
        .select('id, credits_cents')
        .eq('referral_code', trimmed)
        .neq('id', user.id)
        .maybeSingle()

      if (findError || !referrer) throw new Error('Code not found')

      // Mark current user as referred
      const { error: e1 } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', user.id)
      if (e1) throw e1

      // Award €10 (1000 cents) to referrer
      const { error: e2 } = await supabase
        .from('profiles')
        .update({ credits_cents: (referrer.credits_cents ?? 0) + 1000 })
        .eq('id', referrer.id)
      if (e2) throw e2

      // Give referred user €7.50 welcome credit (~15% of avg event)
      const { data: me } = await supabase
        .from('profiles')
        .select('credits_cents')
        .eq('id', user.id)
        .single()
      await supabase
        .from('profiles')
        .update({ credits_cents: (me?.credits_cents ?? 0) + 750 })
        .eq('id', user.id)

      return { referrerId: referrer.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
