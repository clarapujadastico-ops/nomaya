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
          payment_status,
          amount_cents_paid,
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

interface BookEventParams {
  eventId: string
  paymentIntentId?: string
  amountCentsPaid?: number
}

export function useBookEvent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, paymentIntentId, amountCentsPaid }: BookEventParams) => {
      const { data, error } = await supabase
        .from('bookings')
        .upsert(
          {
            user_id: user!.id,
            event_id: eventId,
            status: 'confirmed',
            stripe_payment_intent_id: paymentIntentId ?? null,
            payment_status: paymentIntentId ? 'succeeded' : 'unpaid',
            amount_cents_paid: amountCentsPaid ?? null,
          },
          { onConflict: 'user_id,event_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event_interest_count', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event_attendees', eventId] })
    },
  })
}

interface CancelBookingParams {
  bookingId: string
  choice: 'refund' | 'credits' | 'none'
}

interface CancelBookingResult {
  success: boolean
  refunded_cents?: number
  credits_awarded?: number
}

/** Direct cancel for waitlist / free bookings — no edge function needed */
export function useCancelWaitlist() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string; eventId: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event_interest_count', eventId] })
    },
  })
}

export function useCancelBooking() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, choice }: CancelBookingParams): Promise<CancelBookingResult> => {
      // For non-paid / free bookings just cancel directly — no edge function needed
      if (choice === 'none') {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
          .eq('user_id', user!.id)
        if (error) throw new Error(error.message)
        return { success: true }
      }

      // Paid bookings: try edge function for refund/credits handling
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ bookingId, userId: user!.id, choice }),
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
        return data as CancelBookingResult
      } catch {
        // Edge function unavailable — fall back to direct cancel
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
          .eq('user_id', user!.id)
        if (error) throw new Error(error.message)
        return { success: true }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
