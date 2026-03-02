import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface EventAttendee {
  user_id: string
  profile: { name: string; avatar_url: string | null; bio: string | null } | null
}

export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ['event_attendees', eventId],
    queryFn: async (): Promise<EventAttendee[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('user_id, profile:profiles(name, avatar_url, bio)')
        .eq('event_id', eventId!)
        .eq('status', 'confirmed')
      if (error) throw error
      return (data ?? []) as EventAttendee[]
    },
    enabled: !!eventId,
  })
}
