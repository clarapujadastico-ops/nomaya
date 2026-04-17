import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthStats {
  year: number;
  month: number;
  label: string;
  womenMet: number;
  eventsAttended: number;
  circlesJoined: number;
  isCurrent: boolean;
}

function startOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

function endOfMonth(year: number, month: number): string {
  const d = new Date(year, month + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useMonthlyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly_stats_v3', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const today = todayStr();
      const now = new Date();

      // ── Profile signup date ─────────────────────────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user!.id)
        .single();

      const signupDate = profile?.created_at ? new Date(profile.created_at) : now;
      const signupYear  = signupDate.getFullYear();
      const signupMonth = signupDate.getMonth();

      // ── Build list of months from signup to now ─────────────────────────
      const months: { year: number; month: number }[] = [];
      let y = now.getFullYear(), mo = now.getMonth();
      while (y > signupYear || (y === signupYear && mo >= signupMonth)) {
        months.push({ year: y, month: mo });
        mo--;
        if (mo < 0) { mo = 11; y--; }
      }
      // months[0] = current, months[last] = signup month

      // ── All confirmed bookings (simple query, no join) ──────────────────
      const { data: bookings } = await supabase
        .from('bookings')
        .select('event_id, created_at')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed');

      const confirmedEventIds = (bookings ?? []).map((b: any) => b.event_id as string);

      // ── Event dates for those bookings ──────────────────────────────────
      let eventDateMap: Record<string, string> = {};
      if (confirmedEventIds.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select('id, date')
          .in('id', confirmedEventIds);
        (events ?? []).forEach((e: any) => { eventDateMap[e.id] = e.date; });
      }

      // Completed = event date has passed
      const completedEventIds = confirmedEventIds.filter(id => {
        const d = eventDateMap[id];
        return d && d < today;
      });

      // ── Co-attendees per completed event ────────────────────────────────
      let coByEvent: Record<string, number> = {};
      if (completedEventIds.length > 0) {
        const { data: co } = await supabase
          .from('bookings')
          .select('event_id')
          .in('event_id', completedEventIds)
          .eq('status', 'confirmed')
          .neq('user_id', user!.id);
        (co ?? []).forEach((b: any) => {
          coByEvent[b.event_id] = (coByEvent[b.event_id] ?? 0) + 1;
        });
      }

      // ── Circle memberships ──────────────────────────────────────────────
      const { data: memberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, joined_at, circles(id, name)')
        .eq('user_id', user!.id);

      // ── Build per-month stats ───────────────────────────────────────────
      const monthStats: MonthStats[] = months.map(({ year, month }) => {
        const start = startOfMonth(year, month);
        const end   = endOfMonth(year, month);
        const isCurrent = year === now.getFullYear() && month === now.getMonth();

        const monthEventIds = completedEventIds.filter(id => {
          const d = eventDateMap[id];
          return d && d >= start && d < end;
        });

        const womenMet = monthEventIds.reduce((s, id) => s + (coByEvent[id] ?? 0), 0);

        const circlesJoined = (memberships ?? []).filter((m: any) => {
          const d = (m.joined_at ?? '').slice(0, 10);
          return d >= start && d < end;
        }).length;

        const label = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        return { year, month, label, womenMet, eventsAttended: monthEventIds.length, circlesJoined, isCurrent };
      });

      return {
        monthStats,
        completedTotal: completedEventIds.length,
        totalCircles: (memberships ?? []).length,
      };
    },
  });
}
