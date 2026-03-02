import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/** Returns a map of rated_id → rating for ratings the current user has given at an event */
export function useMyRatingsForEvent(eventId: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my_ratings', eventId, user?.id],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('attendee_ratings')
        .select('rated_id, rating')
        .eq('event_id', eventId!)
        .eq('rater_id', user!.id)
      if (error) throw error
      return Object.fromEntries((data ?? []).map((r) => [r.rated_id, r.rating]))
    },
    enabled: !!eventId && !!user,
  })
}

/** Upserts a rating (1–5) for another attendee at an event */
export function useRateAttendee() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId,
      ratedId,
      rating,
    }: {
      eventId: string
      ratedId: string
      rating: number
    }) => {
      const { error } = await supabase
        .from('attendee_ratings')
        .upsert(
          { rater_id: user!.id, rated_id: ratedId, event_id: eventId, rating },
          { onConflict: 'rater_id,rated_id,event_id' },
        )
      if (error) throw error
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['my_ratings', eventId] })
    },
  })
}
