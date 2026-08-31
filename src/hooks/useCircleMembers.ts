import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface MemberProfile {
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
}

export interface CircleMember {
  user_id: string
  role: 'admin' | 'member'
  profile: MemberProfile | null
}

export function useCircleMembers(circleId: string | null) {
  return useQuery({
    queryKey: ['circle_members', circleId],
    queryFn: async (): Promise<CircleMember[]> => {
      const { data: memberships, error } = await supabase
        .from('circle_memberships')
        .select('user_id, role')
        .eq('circle_id', circleId!)
      if (error) throw error
      if (!memberships || memberships.length === 0) return []

      // profiles_public only exposes the fields the app actually shows for
      // other members — not the full profiles row.
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public')
        .select('id, name, avatar_url, bio, city, interests, horoscope, instagram_url, favourite_song, favourite_food, badges, age_range, life_stage')
        .in('id', memberships.map(m => m.user_id))
      if (profilesError) throw profilesError

      const byId = new Map((profiles ?? []).map(p => [p.id, p]))
      return memberships.map(m => ({ user_id: m.user_id, role: m.role, profile: byId.get(m.user_id) ?? null }))
    },
    enabled: !!circleId,
  })
}
