import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toAppEvent } from '@/types/database'
import type { AppEvent } from '@/types/database'

export function useEvents(): ReturnType<typeof useQuery<AppEvent[]>> {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_with_spots')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []).map(toAppEvent)
    },
    staleTime: 60_000,
  })
}

export function useEvent(id: string): ReturnType<typeof useQuery<AppEvent>> {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_with_spots')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return toAppEvent(data)
    },
    enabled: !!id,
  })
}
