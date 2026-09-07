import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface FamiliarFace {
  user_id: string
  name: string
  avatar_url: string | null
  metEventTitle: string
  metEventTitleEs: string | null
}

/**
 * Attendees of `eventId` the current user has genuinely met before — both
 * checked in (checked_in_at, not just booked or listed) to the same past
 * event. Returns, per attendee, the earliest such shared event.
 *
 * Reuses the same `bookings`/`profiles_public` data and RLS already backing
 * the attendee list (useEventAttendees) — no new tables, no friend graph.
 */
export function useFamiliarFaces(eventId: string | null, attendeeUserIds: string[]) {
  const { user } = useAuth()
  const others = attendeeUserIds.filter((id) => id !== user?.id)

  return useQuery({
    queryKey: ['familiar_faces', eventId, user?.id, [...others].sort().join(',')],
    queryFn: async (): Promise<FamiliarFace[]> => {
      // My own past checked-ins, excluding the event currently being viewed.
      const { data: myBookings, error: myError } = await supabase
        .from('bookings')
        .select('event_id, event:events(title, title_es, date)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .not('checked_in_at', 'is', null)
        .neq('event_id', eventId!)
      if (myError) throw myError

      const myEvents = new Map<string, { title: string; title_es: string | null; date: string }>()
      for (const b of (myBookings ?? []) as any[]) {
        if (b.event) myEvents.set(b.event_id, { title: b.event.title, title_es: b.event.title_es, date: b.event.date })
      }
      if (myEvents.size === 0) return []

      // Which of this event's other attendees checked into any of those same events.
      const { data: theirBookings, error: theirError } = await supabase
        .from('bookings')
        .select('user_id, event_id')
        .in('user_id', others)
        .eq('status', 'confirmed')
        .not('checked_in_at', 'is', null)
        .in('event_id', [...myEvents.keys()])
      if (theirError) throw theirError

      // Earliest shared event per attendee.
      const earliestByAttendee = new Map<string, string>()
      for (const b of theirBookings ?? []) {
        const meta = myEvents.get(b.event_id)
        if (!meta) continue
        const currentEventId = earliestByAttendee.get(b.user_id)
        const currentDate = currentEventId ? myEvents.get(currentEventId)?.date : undefined
        if (!currentDate || meta.date < currentDate) earliestByAttendee.set(b.user_id, b.event_id)
      }
      if (earliestByAttendee.size === 0) return []

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public')
        .select('id, name, avatar_url')
        .in('id', [...earliestByAttendee.keys()])
      if (profilesError) throw profilesError
      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

      return [...earliestByAttendee.entries()]
        .map(([userId, eventId]) => {
          const meta = myEvents.get(eventId)!
          const profile = profileById.get(userId)
          return {
            user_id: userId,
            name: profile?.name?.trim() || 'Someone',
            avatar_url: profile?.avatar_url ?? null,
            metEventTitle: meta.title,
            metEventTitleEs: meta.title_es,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    enabled: !!user && !!eventId && others.length > 0,
  })
}
