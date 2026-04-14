import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface CircleSpotWithCircle extends CircleSpot {
  circle_name: string;
}

export interface CircleSpot {
  id: string;
  circle_id: string;
  added_by: string;
  added_by_profile: { name: string | null; avatar_url: string | null } | null;
  name: string;
  note: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  proposed_date: string | null;
  is_confirmed: boolean;
  vote_count: number;
  user_voted: boolean;
  created_at: string;
}

export function useCircleSpots(circleId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["circle_spots", circleId],
    queryFn: async () => {
      const { data: spots, error } = await supabase
        .from("circle_spots")
        .select("*, circle_spot_votes(user_id), added_by_profile:profiles!added_by(name, avatar_url)")
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (spots ?? []).map((s: any) => ({
        ...s,
        vote_count: s.circle_spot_votes?.length ?? 0,
        user_voted: s.circle_spot_votes?.some((v: any) => v.user_id === user?.id) ?? false,
      })) as CircleSpot[];
    },
    enabled: !!circleId,
  });
}

export function useAddCircleSpot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spot: { circle_id: string; name: string; note?: string; google_maps_url?: string; proposed_date?: string; latitude?: number; longitude?: number }) => {
      const { error } = await supabase.from("circle_spots").insert({ ...spot, added_by: user!.id, vote_count: 0 });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["circle_spots", v.circle_id] }),
  });
}

export function useVoteCircleSpot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ spotId, circleId, voted }: { spotId: string; circleId: string; voted: boolean }) => {
      if (voted) {
        await supabase.from("circle_spot_votes").delete().eq("spot_id", spotId).eq("user_id", user!.id);
        await supabase.from("circle_spots").update({ vote_count: 0 }).eq("id", spotId); // simplified
      } else {
        await supabase.from("circle_spot_votes").insert({ spot_id: spotId, user_id: user!.id });
      }
      // refresh vote count
      const { count } = await supabase.from("circle_spot_votes").select("*", { count: "exact", head: true }).eq("spot_id", spotId);
      await supabase.from("circle_spots").update({ vote_count: count ?? 0 }).eq("id", spotId);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["circle_spots", v.circleId] }),
  });
}

/** Fetches spots from all circles the current user is a member of */
export function useMyCircleSpots() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_circle_spots", user?.id],
    queryFn: async (): Promise<CircleSpotWithCircle[]> => {
      const { data: memberships, error: memErr } = await supabase
        .from("circle_memberships")
        .select("circle_id")
        .eq("user_id", user!.id);
      if (memErr) throw memErr;

      const circleIds = (memberships ?? []).map((m: any) => m.circle_id);
      if (circleIds.length === 0) return [];

      const { data: spots, error: spotsErr } = await supabase
        .from("circle_spots")
        .select("*, added_by_profile:profiles!added_by(name, avatar_url), circle:circles(name)")
        .in("circle_id", circleIds)
        .order("vote_count", { ascending: false });
      if (spotsErr) throw spotsErr;

      return (spots ?? []).map((s: any) => ({
        ...s,
        vote_count: s.vote_count ?? 0,
        user_voted: false,
        circle_name: s.circle?.name ?? "",
      })) as CircleSpotWithCircle[];
    },
    enabled: !!user,
  });
}

export function useDeleteCircleSpot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ spotId, circleId }: { spotId: string; circleId: string }) => {
      const { error } = await supabase
        .from("circle_spots")
        .delete()
        .eq("id", spotId)
        .eq("added_by", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["circle_spots", v.circleId] });
      qc.invalidateQueries({ queryKey: ["my_circle_spots"] });
    },
  });
}

export function useConfirmCircleSpot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ spotId, circleId }: { spotId: string; circleId: string }) => {
      await supabase.from("circle_spots").update({ is_confirmed: true }).eq("id", spotId);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["circle_spots", v.circleId] }),
  });
}
