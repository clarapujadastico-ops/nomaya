import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { sendPush } from "@/lib/notify";

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
      const { data: messages, error } = await supabase
        .from("event_messages")
        .select("id, event_id, user_id, content, created_at")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      const senderIds = [...new Set(messages.map((m) => m.user_id))];
      const { data: senders } = await supabase
        .from("profiles_public")
        .select("id, name, avatar_url")
        .in("id", senderIds);
      const byId = new Map((senders ?? []).map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url }]));

      return messages.map((m) => ({ ...m, sender: byId.get(m.user_id) })) as EventMessage[];
    },
    enabled: !!eventId,
    refetchInterval: 5000,
  });
}

export function useSendEventMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, content, senderName }: { eventId: string; content: string; senderName?: string }) => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: async (_, v) => {
      qc.invalidateQueries({ queryKey: ["event_messages", v.eventId] });
      // Notify via the event's linked circle (created lazily by useEnsureEventCircle)
      const { data: ec } = await supabase
        .from("circles")
        .select("id")
        .eq("event_id", v.eventId)
        .maybeSingle();
      if (ec) {
        const isPhoto = v.content.startsWith("__img__:");
        sendPush({
          circleId: ec.id,
          excludeUserId: user!.id,
          title: v.senderName ? `${v.senderName} 📸` : "Event group",
          body: isPhoto ? "Shared a photo" : v.content.slice(0, 80),
          data: { type: "event_message", event_id: v.eventId },
        });
      }
    },
  });
}
