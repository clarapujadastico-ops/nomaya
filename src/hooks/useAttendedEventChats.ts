import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface AttendedEventChat {
  event_id: string
  title: string
  title_es: string | null
  image_url: string | null
  date: string
}

/**
 * Events the current user genuinely attended (checked_in_at set on a
 * confirmed booking) — the permanent list backing the Chats tab, so a plan's
 * chat stays reachable forever instead of disappearing once the plan is
 * over (unlike the compact "Your bookings" strip on Experiences).
 */
export function useAttendedEventChats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['attended_event_chats', user?.id],
    queryFn: async (): Promise<AttendedEventChat[]> => {
      const [{ data, error }, { data: dismissed, error: dismissedError }] = await Promise.all([
        supabase
          .from('bookings')
          .select('event_id, event:events(id, title, title_es, image_url, date)')
          .eq('user_id', user!.id)
          .eq('status', 'confirmed')
          .not('checked_in_at', 'is', null),
        supabase
          .from('dismissed_event_chats')
          .select('event_id')
          .eq('user_id', user!.id),
      ])
      if (error) throw error
      if (dismissedError) throw dismissedError

      const dismissedIds = new Set((dismissed ?? []).map((d) => d.event_id))
      const todayStr = new Date().toISOString().slice(0, 10)

      return (data ?? [])
        // `event.id` (the events PK) was being mis-typed as `event_id` here,
        // which meant every open from the Chats tab passed `eventId: undefined`
        // to ensureEventCircle — it never found the real event circle, so it
        // silently created a fresh, memberless duplicate every single time
        // (and that duplicate, having event_id: null, leaked into "Your
        // Circles" too, since that list is filtered on event_id being null).
        .map((b: any) => (b.event ? { ...b.event, event_id: b.event.id } as AttendedEventChat : null))
        .filter((e): e is AttendedEventChat => !!e)
        // Only plans that have actually happened — a stale checked_in_at can
        // outlive an event getting rescheduled forward.
        .filter((e) => e.date < todayStr)
        .filter((e) => !dismissedIds.has(e.event_id))
        .sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!user,
  })
}

/** Leave a plan's group chat and remove it from the Chats tab for good. */
export function useLeaveEventChat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ circleId, eventId }: { circleId: string; eventId: string }) => {
      const { error: leaveError } = await supabase
        .from('circle_memberships')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', user!.id)
      if (leaveError) throw leaveError

      const { error: dismissError } = await supabase
        .from('dismissed_event_chats')
        .upsert({ user_id: user!.id, event_id: eventId }, { onConflict: 'user_id,event_id' })
      if (dismissError) throw dismissError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attended_event_chats', user?.id] })
    },
  })
}
