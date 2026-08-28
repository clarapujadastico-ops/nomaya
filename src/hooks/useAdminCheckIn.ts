import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface AttendeeBooking {
  id: string
  user_id: string
  status: string
  checked_in_at: string | null
  profile: { id: string; name: string; avatar_url: string | null } | null
}

/** Confirmed bookings for one event, with attendee profile info — for the admin check-in list */
export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ['event_attendees', eventId],
    queryFn: async (): Promise<AttendeeBooking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, user_id, status, checked_in_at, profile:profiles(id, name, avatar_url)')
        .eq('event_id', eventId!)
        .eq('status', 'confirmed')
        .order('checked_in_at', { ascending: true, nullsFirst: true })
      if (error) throw error
      return (data as any) ?? []
    },
    enabled: !!eventId,
  })
}

interface CheckInParams {
  eventId: string
  bookingId?: string
  memberId?: string // scanned from QR — the member's user id
}

/** Marks a booking checked-in. Pass either bookingId (manual list) or memberId (QR scan). */
export function useCheckInAttendee() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, bookingId, memberId }: CheckInParams) => {
      if (!user) throw new Error('Not signed in')

      let targetBookingId = bookingId
      let attendeeName = ''

      if (!targetBookingId) {
        if (!memberId) throw new Error('No booking or member specified')
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id, profile:profiles(name)')
          .eq('event_id', eventId)
          .eq('user_id', memberId)
          .eq('status', 'confirmed')
          .maybeSingle()
        if (findError) throw findError
        if (!booking) throw new Error('NOT_BOOKED')
        targetBookingId = booking.id
        attendeeName = (booking as any).profile?.name ?? ''
      }

      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString(), checked_in_by: user.id })
        .eq('id', targetBookingId)
        .select('id, profile:profiles(name)')
        .single()
      if (error) throw error

      return { bookingId: targetBookingId, name: attendeeName || (updated as any)?.profile?.name || '' }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_attendees', variables.eventId] })
    },
  })
}
