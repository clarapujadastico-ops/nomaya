import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface PendingFeedbackEvent {
  id: string
  title: string
}

const feedbackKey = (eventId: string) => `nomaya_event_feedback_shown_${eventId}`

export function markFeedbackShown(eventId: string) {
  localStorage.setItem(feedbackKey(eventId), '1')
}

export function usePendingEventFeedback() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['pending_event_feedback', user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async (): Promise<PendingFeedbackEvent | null> => {
      const now = new Date()
      const { data } = await supabase
        .from('bookings')
        .select('event_id, event:events(id, title, date, time)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data) return null

      for (const b of data as any[]) {
        if (!b.event?.date) continue
        // Compare against the event's actual start time plus an assumed 2h
        // duration (events have no stored end time) — otherwise a same-day
        // event (e.g. a 10am class) either never prompts until the following
        // day, or prompts while it's still going on.
        const eventStart = new Date(`${b.event.date}T${b.event.time || '00:00:00'}`)
        const eventEnd = new Date(eventStart.getTime() + 2 * 3_600_000)
        if (eventEnd >= now) continue
        if (!localStorage.getItem(feedbackKey(b.event_id))) {
          return { id: b.event_id, title: b.event.title }
        }
      }
      return null
    },
  })
}
