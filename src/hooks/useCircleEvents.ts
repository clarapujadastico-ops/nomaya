import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CircleEvent } from '@/types/database'

// ─── Read: events for a specific circle (members only via RLS) ────────────────

export function useCircleEvents(circleId: string | null) {
  return useQuery({
    queryKey: ['circleEvents', circleId],
    queryFn: async (): Promise<CircleEvent[]> => {
      const { data, error } = await supabase
        .from('circle_events')
        .select('*')
        .eq('circle_id', circleId!)
        .order('date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!circleId,
  })
}

// ─── Read: all circle events across the user's circles (for map) ──────────────

export interface MyCircleEvent extends CircleEvent {
  circle_name: string
}

export function useMyCircleEvents() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['circleEvents', 'mine', user?.id],
    queryFn: async (): Promise<MyCircleEvent[]> => {
      const { data, error } = await supabase
        .from('circle_events')
        .select(`
          *,
          circle:circles ( name )
        `)
        .order('date', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => ({
        ...row,
        circle_name: (row.circle as { name: string } | null)?.name ?? 'Circle',
      }))
    },
    enabled: !!user,
  })
}

// ─── Mutation: create a circle event (admin only via RLS) ─────────────────────

export function useCreateCircleEvent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      circle_id: string
      title: string
      description?: string
      date: string
      location?: string
      max_spots?: number | null
    }) => {
      const { data, error } = await supabase
        .from('circle_events')
        .insert({ ...input, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['circleEvents', variables.circle_id] })
      queryClient.invalidateQueries({ queryKey: ['circleEvents', 'mine'] })
    },
  })
}
