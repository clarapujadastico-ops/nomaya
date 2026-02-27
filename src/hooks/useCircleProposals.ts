import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface CircleProposal {
  id: string;
  proposed_by: string;
  name: string;
  description: string | null;
  city: string;
  status: "proposed" | "active" | "official";
  interest_count: number;
  meeting_count: number;
  user_interested: boolean;
  created_at: string;
}

const ACTIVATION_THRESHOLD = 5;

export function useCircleProposals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["circle_proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circle_proposals")
        .select("*, circle_proposal_interest(user_id)")
        .order("interest_count", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        interest_count: p.circle_proposal_interest?.length ?? 0,
        user_interested: p.circle_proposal_interest?.some((i: any) => i.user_id === user?.id) ?? false,
      })) as CircleProposal[];
    },
  });
}

export function useProposeCircle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposal: { name: string; description?: string; city?: string }) => {
      const { error } = await supabase.from("circle_proposals").insert({
        proposed_by: user!.id,
        name: proposal.name,
        description: proposal.description ?? null,
        city: proposal.city ?? "Madrid",
        status: "proposed",
        interest_count: 0,
        meeting_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle_proposals"] }),
  });
}

export function useToggleProposalInterest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ proposalId, interested }: { proposalId: string; interested: boolean }) => {
      if (interested) {
        await supabase.from("circle_proposal_interest").delete().eq("proposal_id", proposalId).eq("user_id", user!.id);
      } else {
        await supabase.from("circle_proposal_interest").insert({ proposal_id: proposalId, user_id: user!.id });
      }
      // recalculate count
      const { count } = await supabase.from("circle_proposal_interest").select("*", { count: "exact", head: true }).eq("proposal_id", proposalId);
      const newCount = count ?? 0;
      const newStatus = newCount >= ACTIVATION_THRESHOLD ? "active" : "proposed";
      await supabase.from("circle_proposals").update({ interest_count: newCount, status: newStatus }).eq("id", proposalId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circle_proposals"] }),
  });
}

export { ACTIVATION_THRESHOLD };
