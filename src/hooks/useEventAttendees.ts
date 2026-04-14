import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface EventAttendee {
  user_id: string
  profile: {
    name: string
    avatar_url: string | null
    bio: string | null
    city: string
    interests: string[]
    horoscope: string | null
    instagram_url: string | null
    favourite_song: string | null
    favourite_food: string | null
    badges: string[]
    age_range: string | null
    life_stage: string | null
    birthday: string | null
  } | null
}

export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ['event_attendees', eventId],
    queryFn: async (): Promise<EventAttendee[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('user_id, profile:profiles(name, avatar_url, bio, city, interests, horoscope, instagram_url, favourite_song, favourite_food, badges, age_range, life_stage, birthday)')
        .eq('event_id', eventId!)
        .eq('status', 'confirmed')
      if (error) throw error
      return (data ?? []) as EventAttendee[]
    },
    enabled: !!eventId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
