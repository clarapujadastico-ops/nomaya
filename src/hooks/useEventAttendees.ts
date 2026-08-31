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
  } | null
}

export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ['event_attendees', eventId],
    queryFn: async (): Promise<EventAttendee[]> => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('event_id', eventId!)
        .eq('status', 'confirmed')
      if (error) throw error
      if (!bookings || bookings.length === 0) return []

      // profiles_public only exposes the fields the app actually shows for
      // other members — not the full profiles row (no birthday, credits,
      // verification status, etc.)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public')
        .select('id, name, avatar_url, bio, city, interests, horoscope, instagram_url, favourite_song, favourite_food, badges, age_range, life_stage')
        .in('id', bookings.map(b => b.user_id))
      if (profilesError) throw profilesError

      const byId = new Map((profiles ?? []).map(p => [p.id, p]))
      return bookings.map(b => ({ user_id: b.user_id, profile: byId.get(b.user_id) ?? null }))
    },
    enabled: !!eventId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
