import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CircleMember {
  user_id: string
  role: 'admin' | 'member'
  profile: { name: string; avatar_url: string | null } | null
}

export function useCircleMembers(circleId: string | null) {
  return useQuery({
    queryKey: ['circle_members', circleId],
    queryFn: async (): Promise<CircleMember[]> => {
      const { data, error } = await supabase
        .from('circle_memberships')
        .select('user_id, role, profile:profiles(name, avatar_url)')
        .eq('circle_id', circleId!)
        .limit(12)
      if (error) throw error
      return (data ?? []) as CircleMember[]
    },
    enabled: !!circleId,
  })
}
