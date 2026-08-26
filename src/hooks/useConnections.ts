import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { MemberProfile } from './useCircleMembers'

export interface Connection {
  user_id: string
  profile: MemberProfile
  via: 'circle' | 'event'
  context: string   // circle name or event title
  circle_id: string | null
}

export function useConnections() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['connections', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<Connection[]> => {
      const profileFields = 'name, avatar_url, bio, city, interests, horoscope, instagram_url, favourite_song, favourite_food, badges, age_range, life_stage, birthday'

      const [{ data: myCircles }, { data: myBookings }] = await Promise.all([
        supabase.from('circle_memberships').select('circle_id, circles(name)').eq('user_id', user!.id),
        supabase.from('bookings').select('event_id, events(title)').eq('user_id', user!.id).eq('status', 'confirmed'),
      ])

      const circleIds = (myCircles ?? []).map((m: any) => m.circle_id)
      const eventIds = (myBookings ?? []).map((b: any) => b.event_id)

      const [{ data: circleMembers }, { data: eventAttendees }] = await Promise.all([
        circleIds.length > 0
          ? supabase
              .from('circle_memberships')
              .select(`user_id, circle_id, circles(id, name), profile:profiles(${profileFields})`)
              .in('circle_id', circleIds)
              .neq('user_id', user!.id)
          : Promise.resolve({ data: [] }),
        eventIds.length > 0
          ? supabase
              .from('bookings')
              .select(`user_id, event_id, events(title), profile:profiles(${profileFields})`)
              .in('event_id', eventIds)
              .neq('user_id', user!.id)
              .eq('status', 'confirmed')
          : Promise.resolve({ data: [] }),
      ])

      const seen = new Set<string>()
      const connections: Connection[] = []

      for (const m of (circleMembers ?? []) as any[]) {
        if (!seen.has(m.user_id) && m.profile) {
          seen.add(m.user_id)
          connections.push({
            user_id: m.user_id,
            profile: m.profile as MemberProfile,
            via: 'circle',
            context: m.circles?.name ?? 'a circle',
            circle_id: m.circle_id,
          })
        }
      }

      for (const a of (eventAttendees ?? []) as any[]) {
        if (!seen.has(a.user_id) && a.profile) {
          seen.add(a.user_id)
          connections.push({
            user_id: a.user_id,
            profile: a.profile as MemberProfile,
            via: 'event',
            context: a.events?.title ?? 'an event',
            circle_id: null,
          })
        }
      }

      return connections
    },
  })
}
