import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthStats {
  year: number;
  month: number;             // 0-indexed (JS Date)
  label: string;             // "April 2026"
  womenMet: number;
  eventsAttended: number;
  circlesJoined: number;
  isCurrent: boolean;
}

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end   = new Date(year, month + 1, 1).toISOString().slice(0, 10);
  return { start, end };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthsBetween(from: Date, to: Date): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(),   to.getMonth(),   1);
  while (cur <= end) {
    result.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

export function useMonthlyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly_stats_v2', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const todayStr = today();
      const now = new Date();

      // ── Get profile creation date ────────────────────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, id')
        .eq('id', user!.id)
        .single();

      const signupDate = profile?.created_at ? new Date(profile.created_at) : now;
      const months = monthsBetween(signupDate, now).reverse(); // most recent first

      // ── All confirmed bookings with event dates ──────────────────────────
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('event_id, events_with_spots(date, category_name, total_spots, spots_left)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed');

      // Completed = confirmed + event date in the past
      const completed = (allBookings ?? []).filter((b: any) => {
        const d = b.events_with_spots?.date;
        return d && d < todayStr;
      });

      // ── All circle memberships ───────────────────────────────────────────
      const { data: allMemberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, joined_at')
        .eq('user_id', user!.id);

      // ── Co-attendees for all completed events (one query) ─────────────────
      const completedEventIds = completed.map((b: any) => b.event_id);
      let coAttendeesByEvent: Record<string, number> = {};

      if (completedEventIds.length > 0) {
        const { data: co } = await supabase
          .from('bookings')
          .select('event_id')
          .in('event_id', completedEventIds)
          .eq('status', 'confirmed')
          .neq('user_id', user!.id);

        (co ?? []).forEach((b: any) => {
          coAttendeesByEvent[b.event_id] = (coAttendeesByEvent[b.event_id] ?? 0) + 1;
        });
      }

      // ── Build per-month stats ────────────────────────────────────────────
      const monthStats: MonthStats[] = months.map(({ year, month }) => {
        const { start, end } = monthRange(year, month);
        const isCurrent = year === now.getFullYear() && month === now.getMonth();

        // Events attended in this month
        const monthEvents = completed.filter((b: any) => {
          const d = b.events_with_spots?.date;
          return d && d >= start && d < end;
        });

        // Women met in this month
        const womenMet = monthEvents.reduce((sum: number, b: any) => {
          return sum + (coAttendeesByEvent[b.event_id] ?? 0);
        }, 0);

        // Circles joined in this month
        const circlesJoined = (allMemberships ?? []).filter((m: any) => {
          const d = m.joined_at?.slice(0, 10);
          return d && d >= start && d < end;
        }).length;

        const label = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        return {
          year, month, label,
          womenMet,
          eventsAttended: monthEvents.length,
          circlesJoined,
          isCurrent,
        };
      });

      // ── Totals for other parts of the screen ────────────────────────────
      const { data: totalMemberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, joined_at, circles(id, name, categories(name))')
        .eq('user_id', user!.id);

      const bookingsByCategory: Record<string, number> = {};
      completed.forEach((b: any) => {
        const cat = b.events_with_spots?.category_name;
        if (cat) bookingsByCategory[cat] = (bookingsByCategory[cat] ?? 0) + 1;
      });

      const allCircles = (totalMemberships ?? []).map((m: any) => ({
        id: m.circles?.id,
        name: m.circles?.name ?? 'Circle',
        sessions: bookingsByCategory[m.circles?.categories?.name ?? ''] ?? 0,
        joinedAt: m.joined_at as string,
      })).sort((a: any, b: any) => b.sessions - a.sessions || new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

      return {
        monthStats,
        completedTotal: completed.length,
        totalCircles: (totalMemberships ?? []).length,
        top3Circles: allCircles.slice(0, 3),
      };
    },
  });
}
