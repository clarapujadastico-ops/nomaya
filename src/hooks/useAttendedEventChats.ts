import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface AttendedEventChat {
  event_id: string
  title: string
  title_es: string | null
  image_url: string | null
  date: string
}

/**
 * Events the current user genuinely attended (checked_in_at set on a
 * confirmed booking) — the permanent list backing the Chats tab, so a plan's
 * chat stays reachable forever instead of disappearing once the plan is
 * over (unlike the compact "Your bookings" strip on Experiences).
 */
export function useAttendedEventChats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['attended_event_chats', user?.id],
    queryFn: async (): Promise<AttendedEventChat[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('event_id, event:events(id, title, title_es, image_url, date)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .not('checked_in_at', 'is', null)
      if (error) throw error

      return (data ?? [])
        .map((b: any) => b.event as AttendedEventChat | null)
        .filter((e): e is AttendedEventChat => !!e)
        .sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!user,
  })
}
