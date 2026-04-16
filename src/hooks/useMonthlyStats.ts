import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function useMonthlyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly_stats', user?.id, new Date().getMonth()],
    enabled: !!user,
    queryFn: async () => {
      const monthStart = startOfMonth();

      // Bookings this month (confirmed, event date in current month)
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('event_id, status, events_with_spots(date, category_name, total_spots, spots_left)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed');

      const thisMonthBookings = (allBookings ?? []).filter((b: any) => {
        const date = b.events_with_spots?.date;
        return date && date >= monthStart.slice(0, 10);
      });

      // Women met this month: sum of attendees (total_spots - spots_left) for each event
      const womenMet = thisMonthBookings.reduce((sum: number, b: any) => {
        const ev = b.events_with_spots;
        if (!ev) return sum;
        const others = Math.max(0, (ev.total_spots - ev.spots_left) - 1);
        return sum + others;
      }, 0);

      // Circles joined this month
      const { data: memberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, role, joined_at, circles(name, category_id, categories(name))')
        .eq('user_id', user!.id)
        .gte('joined_at', monthStart);

      const circlesJoinedCount = (memberships ?? []).length;

      // All my circles with session count (bookings per category)
      const { data: allMemberships } = await supabase
        .from('circle_memberships')
        .select('circle_id, joined_at, circles(id, name, category_id, categories(name))')
        .eq('user_id', user!.id);

      // Count confirmed bookings per category
      const bookingsByCategory: Record<string, number> = {};
      (allBookings ?? [])
        .filter((b: any) => b.status === 'confirmed' && b.events_with_spots?.category_name)
        .forEach((b: any) => {
          const cat = b.events_with_spots.category_name;
          bookingsByCategory[cat] = (bookingsByCategory[cat] ?? 0) + 1;
        });

      const myCircles = (allMemberships ?? []).map((m: any) => {
        const circle = m.circles;
        const categoryName = circle?.categories?.name ?? '';
        return {
          id: circle?.id,
          name: circle?.name ?? 'Circle',
          categoryName,
          sessions: bookingsByCategory[categoryName] ?? 0,
          joinedAt: m.joined_at,
        };
      });

      return {
        womenMet,
        circlesJoinedCount,
        myCircles,
        eventsThisMonth: thisMonthBookings.length,
        totalEvents: (allBookings ?? []).filter((b: any) => b.status === 'confirmed').length,
      };
    },
  });
}
