import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useBlockedUsers() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['blocked_users', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)
      if (error) throw error
      return (data ?? []).map((row: { blocked_id: string }) => row.blocked_id)
    },
    enabled: !!user,
  })
}

export function useReportMessage() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      messageId,
      reportedUserId,
      circleId,
      messageContent,
    }: {
      messageId: string
      reportedUserId: string
      circleId: string
      messageContent: string
    }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user!.id,
        reported_user_id: reportedUserId,
        message_id: messageId,
        circle_id: circleId,
        message_content: messageContent,
      })
      if (error) throw error
    },
  })
}

export function useBlockUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: user!.id,
        blocked_id: blockedId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked_users', user?.id] })
    },
  })
}
