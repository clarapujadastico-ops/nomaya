import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/** Returns total interest count for an event */
export function useEventInterestCount(eventId: string) {
  return useQuery({
    queryKey: ["event_interest_count", eventId],
    queryFn: async () => {
      const { count } = await supabase
        .from("event_interest")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);
      return count ?? 0;
    },
    enabled: !!eventId,
  });
}

/** Returns whether the current user has registered interest, + toggle mutation */
export function useEventInterest(eventId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isInterested = false, isLoading } = useQuery({
    queryKey: ["event_interest", eventId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("event_interest")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!eventId && !!user,
  });

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isInterested) {
        await supabase
          .from("event_interest")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("event_interest")
          .insert({ event_id: eventId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_interest", eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["event_interest_count", eventId] });
    },
  });

  return { isInterested, toggle, isPending, isLoading };
}
