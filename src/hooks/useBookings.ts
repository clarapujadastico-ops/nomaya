import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BookingWithEvent } from '@/types/database'

export function useBookings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async (): Promise<BookingWithEvent[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          event_id,
          status,
          created_at,
          event:events (
            id,
            title,
            date,
            city,
            image_url,
            price_cents,
            currency,
            category:categories ( name, color )
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as BookingWithEvent[]
    },
    enabled: !!user,
  })
}

export function useBookEvent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .upsert(
          { user_id: user!.id, event_id: eventId, status: 'confirmed' },
          { onConflict: 'user_id,event_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCancelBooking() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
