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
  birthday: string | null
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
      const { data, error } = await supabase
        .from('circle_memberships')
        .select('user_id, role, profile:profiles(name, avatar_url, bio, city, interests, horoscope, instagram_url, favourite_song, favourite_food, badges, age_range, life_stage, birthday)')
        .eq('circle_id', circleId!)
      if (error) throw error
      return (data ?? []) as CircleMember[]
    },
    enabled: !!circleId,
  })
}
