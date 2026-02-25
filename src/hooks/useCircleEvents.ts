import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CircleEvent } from '@/types/database'

// ─── Read: events for a circle (RLS returns approved + own pending) ────────────

export function useCircleEvents(circleId: string | null) {
  return useQuery({
    queryKey: ['circleEvents', circleId],
    queryFn: async (): Promise<CircleEvent[]> => {
      const { data, error } = await supabase
        .from('circle_events')
        .select('*')
        .eq('circle_id', circleId!)
        .neq('status', 'rejected')
        .order('date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!circleId,
  })
}

// ─── Read: approved circle events across user's circles (for map) ─────────────

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
        .select(`*, circle:circles ( name )`)
        .eq('status', 'approved')
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

// ─── Mutation: submit a circle event (status set by caller based on role/policy) ─

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
      status: 'approved' | 'pending'
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

// ─── Mutation: admin approve or reject a pending event ────────────────────────

export function useUpdateCircleEventStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId, circleId, status,
    }: { eventId: string; circleId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('circle_events')
        .update({ status })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['circleEvents', variables.circleId] })
      queryClient.invalidateQueries({ queryKey: ['circleEvents', 'mine'] })
    },
  })
}
