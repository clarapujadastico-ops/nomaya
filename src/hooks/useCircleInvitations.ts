import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CircleInvitation {
  id: string;
  circle_id: string;
  invited_user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  circle: { name: string; cover_url: string | null; category_id: string | null } | null;
  inviter: { name: string; avatar_url: string | null } | null;
}

/** Pending invitations for the current user */
export function useMyCircleInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['circle_invitations', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('circle_invitations')
        .select(`
          id, circle_id, invited_user_id, invited_by, status, created_at,
          circle:circles(name, cover_url, category_id),
          inviter:profiles!invited_by(name, avatar_url)
        `)
        .eq('invited_user_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CircleInvitation[];
    },
  });
}

/** Respond to an invitation (accept/decline) */
export function useRespondToCircleInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ invitationId, accept, circleId }: { invitationId: string; accept: boolean; circleId: string }) => {
      // Update invitation status
      const { error } = await supabase
        .from('circle_invitations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', invitationId);
      if (error) throw error;

      // If accepting, add to circle
      if (accept && user) {
        const { error: joinError } = await supabase
          .from('circle_memberships')
          .upsert({ circle_id: circleId, user_id: user.id, role: 'member' });
        if (joinError) throw joinError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['circle_invitations'] });
      qc.invalidateQueries({ queryKey: ['circles'] });
      qc.invalidateQueries({ queryKey: ['my_circles'] });
    },
  });
}

/** Search Nomaya users by name (for admin invite) */
export function useSearchUsers(query: string, circleId: string) {
  return useQuery({
    queryKey: ['search_users', query, circleId],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      // Get existing members and pending invitees to exclude them
      const [{ data: members }, { data: invites }] = await Promise.all([
        supabase.from('circle_memberships').select('user_id').eq('circle_id', circleId),
        supabase.from('circle_invitations').select('invited_user_id').eq('circle_id', circleId).eq('status', 'pending'),
      ]);
      const excludeIds = [
        ...(members ?? []).map((m: { user_id: string }) => m.user_id),
        ...(invites ?? []).map((i: { invited_user_id: string }) => i.invited_user_id),
      ];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, city')
        .ilike('name', `%${query.trim()}%`)
        .limit(10);
      if (error) throw error;
      return (data ?? []).filter((u: { id: string }) => !excludeIds.includes(u.id));
    },
  });
}

/** Send a circle invitation + push notification */
export function useSendCircleInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ circleId, invitedUserId, circleName }: { circleId: string; invitedUserId: string; circleName: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert invitation
      const { error } = await supabase
        .from('circle_invitations')
        .insert({ circle_id: circleId, invited_user_id: invitedUserId, invited_by: user.id });
      if (error) throw error;

      // Get inviter name
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      const inviterName = inviterProfile?.name ?? 'Someone';

      // Send push notification
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              userId: invitedUserId,
              title: `${inviterName} invited you to a circle`,
              body: `You've been invited to join "${circleName}". Open the app to accept.`,
              data: { tab: 'groups' },
            }),
          }
        ).catch(() => {}); // push failure is non-fatal
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['circle_invitations'] });
    },
  });
}
