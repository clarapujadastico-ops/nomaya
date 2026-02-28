import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { sendPush } from '@/lib/notify'

export interface CircleMessage {
  id: string
  circle_id: string
  user_id: string
  content: string
  created_at: string
  sender: {
    name: string
    avatar_url: string | null
  } | null
}

export function useCircleMessages(circleId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!circleId) return
    const channel = supabase
      .channel(`circle-messages-${circleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'circle_messages', filter: `circle_id=eq.${circleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['circle_messages', circleId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [circleId, queryClient])

  return useQuery({
    queryKey: ['circle_messages', circleId],
    queryFn: async (): Promise<CircleMessage[]> => {
      const { data, error } = await supabase
        .from('circle_messages')
        .select('*, sender:profiles!circle_messages_user_id_fkey(name, avatar_url)')
        .eq('circle_id', circleId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: {
        id: string
        circle_id: string
        user_id: string
        content: string
        created_at: string
        sender: { name: string; avatar_url: string | null } | null
      }) => ({
        id: row.id,
        circle_id: row.circle_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        sender: row.sender,
      }))
    },
    enabled: !!circleId,
  })
}

export function useSendMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ circleId, content, senderName }: { circleId: string; content: string; senderName?: string }) => {
      const { error } = await supabase
        .from('circle_messages')
        .insert({ circle_id: circleId, user_id: user!.id, content })
      if (error) throw error
    },
    onSuccess: (_, { circleId, content, senderName }) => {
      queryClient.invalidateQueries({ queryKey: ['circle_messages', circleId] })
      sendPush({
        circleId,
        excludeUserId: user!.id,
        title: senderName ? `${senderName} 💬` : 'New message',
        body: content.length > 80 ? content.slice(0, 77) + '…' : content,
        data: { type: 'circle_message', circle_id: circleId },
      })
    },
  })
}
