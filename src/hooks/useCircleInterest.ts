import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/** Which specific preview circles the current user has signalled interest in. */
export function useCircleInterestSignups() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['circle_interest', user?.id],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('circle_interest')
        .select('circle_name')
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map(r => r.circle_name)
    },
    enabled: !!user,
  })
}

/** Records that the current user wants to be told when a specific circle launches. */
export function useSignalCircleInterest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (circleName: string) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('circle_interest')
        .upsert({ user_id: user.id, circle_name: circleName }, { onConflict: 'user_id,circle_name' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle_interest', user?.id] })
    },
  })
}
