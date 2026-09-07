import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface PendingReferralNotice {
  id: string
  name: string
}

const shownKey = (referredUserId: string) => `nomaya_referral_notice_shown_${referredUserId}`

export function markReferralNoticeShown(referredUserId: string) {
  localStorage.setItem(shownKey(referredUserId), '1')
}

/** Most recent person who signed up with the current user's referral code, if not yet shown on this device. */
export function usePendingReferralNotice() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['pending_referral_notice', user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async (): Promise<PendingReferralNotice | null> => {
      const { data } = await supabase.rpc('get_my_referrals')
      if (!data) return null

      for (const r of data as { id: string; name: string | null }[]) {
        if (!localStorage.getItem(shownKey(r.id))) {
          return { id: r.id, name: r.name && r.name.trim() ? r.name.trim() : 'Someone' }
        }
      }
      return null
    },
  })
}
