import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export function useEventMessages(eventId: string | null) {
  return useQuery({
    queryKey: ["event_messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*, sender:profiles!user_id(name, avatar_url)")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventMessage[];
    },
    enabled: !!eventId,
    refetchInterval: 5000,
  });
}

export function useSendEventMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, content }: { eventId: string; content: string }) => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["event_messages", v.eventId] }),
  });
}
