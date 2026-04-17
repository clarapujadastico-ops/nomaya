import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useMonthlyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly_stats', user?.id, new Date().toISOString().slice(0, 7)],
    enabled: !!user,
    queryFn: async () => {
      const monthStart = startOfMonth();
      const todayStr = today();

      // ── Confirmed bookings with event dates ────────────────────────────────
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('event_id, status, created_at, events_with_spots(id, date, category_name, total_spots, spots_left)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed');

      // "Completed" = confirmed booking AND event date has passed
      const completed = (allBookings ?? []).filter((b: any) => {
        const date = b.events_with_spots?.date;
        return date && date < todayStr;
      });

      // Completed events this month
      const completedThisMonth = completed.filter((b: any) => {
        const date = b.events_with_spots?.date;
        return date && date >= monthStart;
      });

      // ── Women met this month ───────────────────────────────────────────────
      // For each completed event this month, count total confirmed bookings for that event
      let womenMet = 0;
      if (completedThisMonth.length > 0) {
        const eventIds = completedThisMonth.map((b: any) => b.event_id);
        const { data: coAttendees } = await supabase
          .from('bookings')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('status', 'confirmed')
          .neq('user_id', user!.id);

        // Count per event, sum all
        const countByEvent: Record<string, number> = {};
        (coAttendees ?? []).forEach((b: any) => {
          countByEvent[b.event_id] = (countByEvent[b.event_id] ?? 0) + 1;
        });
        womenMet = Object.values(countByEvent).reduce((s, n) => s + n, 0);
      }

      // ── All circles ────────────────────────────────────────────────────────
      const { data: allMemberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, joined_at, circles(id, name, category_id, categories(name))')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: false });

      // Count confirmed bookings per category for "sessions" approximation
      const bookingsByCategory: Record<string, number> = {};
      completed.forEach((b: any) => {
        const cat = b.events_with_spots?.category_name;
        if (cat) bookingsByCategory[cat] = (bookingsByCategory[cat] ?? 0) + 1;
      });

      const allCircles = (allMemberships ?? []).map((m: any) => {
        const circle = m.circles;
        const categoryName = circle?.categories?.name ?? '';
        return {
          id: circle?.id,
          name: circle?.name ?? 'Circle',
          categoryName,
          sessions: bookingsByCategory[categoryName] ?? 0,
          joinedAt: m.joined_at as string,
        };
      });

      // Top 3: prioritise circles where user has sessions, then most recently joined
      const top3Circles = [...allCircles]
        .sort((a, b) => b.sessions - a.sessions || new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, 3);

      return {
        womenMet,
        totalCircles: allCircles.length,
        top3Circles,
        eventsThisMonth: completedThisMonth.length,
        completedTotal: completed.length,   // used for unlocking moments/hosting
      };
    },
  });
}
