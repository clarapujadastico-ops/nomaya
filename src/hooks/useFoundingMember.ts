import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

/**
 * Checks on mount whether the current user's email appears in the
 * event_attendance table (attended = true). If so, adds 'founding_member'
 * to their profile badges. Silently no-ops if the table doesn't exist yet.
 */
export function useFoundingMemberBadge() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()

  useEffect(() => {
    if (!user?.email || !profile) return
    const badges: string[] = (profile as { badges?: string[] }).badges ?? []
    if (badges.includes('founding_member')) return

    async function check() {
      try {
        const { data } = await supabase
          .from('event_attendance')
          .select('id')
          .eq('email', user!.email!)
          .eq('attended', true)
          .limit(1)
          .maybeSingle()
        if (data) {
          updateProfile({ badges: [...badges, 'founding_member'] })
        }
      } catch {
        // Table may not exist yet — ignore
      }
    }
    check()
  }, [user?.email, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
}
