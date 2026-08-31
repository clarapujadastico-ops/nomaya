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

async function lookupName(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles_public').select('name').eq('id', userId).maybeSingle()
  return data?.name ?? ''
}

/** Confirmed bookings for one event, with attendee profile info — for the admin check-in list */
export function useAdminEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ['admin_event_attendees', eventId],
    queryFn: async (): Promise<AttendeeBooking[]> => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, user_id, status, checked_in_at')
        .eq('event_id', eventId!)
        .eq('status', 'confirmed')
        .order('checked_in_at', { ascending: true, nullsFirst: true })
      if (error) throw error
      if (!bookings || bookings.length === 0) return []

      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('id, name, avatar_url')
        .in('id', bookings.map(b => b.user_id))
      const byId = new Map((profiles ?? []).map(p => [p.id, p]))

      return bookings.map(b => ({ ...b, profile: byId.get(b.user_id) ?? null }))
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
      let targetUserId = ''
      let alreadyCheckedIn = false

      if (targetBookingId) {
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id, user_id, checked_in_at')
          .eq('id', targetBookingId)
          .single()
        if (findError) throw findError
        targetUserId = booking.user_id
        alreadyCheckedIn = !!booking.checked_in_at
      } else {
        if (!memberId) throw new Error('No booking or member specified')
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id, user_id, checked_in_at')
          .eq('event_id', eventId)
          .eq('user_id', memberId)
          .eq('status', 'confirmed')
          .maybeSingle()
        if (findError) throw findError
        if (!booking) throw new Error('NOT_BOOKED')
        targetBookingId = booking.id
        targetUserId = booking.user_id
        alreadyCheckedIn = !!booking.checked_in_at
      }

      if (alreadyCheckedIn) throw new Error('ALREADY_CHECKED_IN')

      const { error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString(), checked_in_by: user.id })
        .eq('id', targetBookingId)
      if (error) throw error

      const name = await lookupName(targetUserId)
      return { bookingId: targetBookingId, name }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin_event_attendees', variables.eventId] })
    },
  })
}
