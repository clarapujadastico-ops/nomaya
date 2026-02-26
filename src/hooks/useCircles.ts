import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toAppCircle } from '@/types/database'
import type { AppCircle, MembershipWithCircle } from '@/types/database'

// ─── Read: all public circles ─────────────────────────────────────────────────

export function useCircles() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['circles'],
    queryFn: async (): Promise<AppCircle[]> => {
      const [{ data: circles, error: circlesError }, { data: memberships, error: membershipsError }] =
        await Promise.all([
          supabase.from('circles_with_members').select('*').order('created_at', { ascending: false }),
          supabase
            .from('circle_memberships')
            .select('circle_id, role')
            .eq('user_id', user!.id),
        ])

      if (circlesError) throw circlesError
      if (membershipsError) throw membershipsError

      const membershipMap = new Map<string, 'admin' | 'member'>(
        (memberships ?? []).map((m) => [m.circle_id, m.role as 'admin' | 'member'])
      )

      return (circles ?? []).map((row) =>
        toAppCircle(row, user!.id, membershipMap.get(row.id) ?? null)
      )
    },
    enabled: !!user,
  })
}

// ─── Read: only circles the current user belongs to ───────────────────────────

export function useMyCircles() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['circles', 'mine', user?.id],
    queryFn: async (): Promise<MembershipWithCircle[]> => {
      const { data, error } = await supabase
        .from('circle_memberships')
        .select(`
          id,
          circle_id,
          role,
          joined_at,
          circle:circles (
            id,
            name,
            description,
            city,
            cover_url,
            is_private,
            category:categories ( name, color )
          )
        `)
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as MembershipWithCircle[]
    },
    enabled: !!user,
  })
}

// ─── Mutation: join a circle ───────────────────────────────────────────────────

export function useJoinCircle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (circleId: string) => {
      const { data, error } = await supabase
        .from('circle_memberships')
        .insert({ circle_id: circleId, user_id: user!.id, role: 'member' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: leave a circle ──────────────────────────────────────────────────

export function useLeaveCircle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (circleId: string) => {
      const { error } = await supabase
        .from('circle_memberships')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: request to join a private circle ───────────────────────────────

export function useRequestJoinCircle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ circleId, message }: { circleId: string; message: string }) => {
      const { error } = await supabase
        .from('circle_join_requests')
        .insert({ circle_id: circleId, user_id: user!.id, message, status: 'pending' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join_requests'] })
    },
  })
}

export function useMyJoinRequests() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['join_requests', user?.id],
    queryFn: async (): Promise<{ circle_id: string; status: string }[]> => {
      const { data, error } = await supabase
        .from('circle_join_requests')
        .select('circle_id, status')
        .eq('user_id', user!.id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

// ─── Read: pending join requests for a circle (admin only) ───────────────────

export interface JoinRequest {
  id: string
  circle_id: string
  user_id: string
  message: string
  status: string
  created_at: string
  profile: { name: string; avatar_url: string | null; bio: string | null; city: string } | null
}

export function useCircleJoinRequests(circleId: string | null) {
  return useQuery({
    queryKey: ['join_requests', 'circle', circleId],
    queryFn: async (): Promise<JoinRequest[]> => {
      const { data, error } = await supabase
        .from('circle_join_requests')
        .select('id, circle_id, user_id, message, status, created_at, profile:profiles ( name, avatar_url, bio, city )')
        .eq('circle_id', circleId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as JoinRequest[]
    },
    enabled: !!circleId,
  })
}

// ─── Mutation: approve or reject a join request ───────────────────────────────

export function useRespondToJoinRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId, circleId, userId, approve,
    }: { requestId: string; circleId: string; userId: string; approve: boolean }) => {
      if (approve) {
        const { error: memberError } = await supabase
          .from('circle_memberships')
          .insert({ circle_id: circleId, user_id: userId, role: 'member' })
        if (memberError) throw memberError
      }
      const { error } = await supabase
        .from('circle_join_requests')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join_requests'] })
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: update circle cover image (admin only) ─────────────────────────

export function useUpdateCircleCover() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ circleId, coverUrl }: { circleId: string; coverUrl: string | null }) => {
      const { error } = await supabase
        .from('circles')
        .update({ cover_url: coverUrl })
        .eq('id', circleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: update circle event policy (admin only) ────────────────────────

export function useUpdateCircleEventPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ circleId, policy }: { circleId: string; policy: 'open' | 'review' }) => {
      const { error } = await supabase
        .from('circles')
        .update({ event_policy: policy })
        .eq('id', circleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: find or create an event circle, ensure user is a member ───────

export function useEnsureEventCircle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, eventTitle }: { eventId: string; eventTitle: string }) => {
      // 1. Look for an existing circle tied to this event
      const { data: existing } = await supabase
        .from('circles')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle()

      let circleId: string

      if (existing) {
        circleId = existing.id
      } else {
        // 2. Create a new circle for this event
        const { data: newCircle, error } = await supabase
          .from('circles')
          .insert({
            name: eventTitle,
            description: `Chat for attendees of ${eventTitle}`,
            event_id: eventId,
            created_by: user!.id,
            is_private: false,
          })
          .select('id')
          .single()
        if (error) throw error
        circleId = newCircle.id
      }

      // 3. Ensure user is a member (upsert, ignore conflict)
      await supabase
        .from('circle_memberships')
        .upsert(
          { circle_id: circleId, user_id: user!.id, role: 'member' },
          { onConflict: 'circle_id,user_id' }
        )

      return circleId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}

// ─── Mutation: create a circle ────────────────────────────────────────────────

export function useCreateCircle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      city?: string
      category_id?: string | null
      cover_url?: string | null
      is_private?: boolean
    }) => {
      // 1. create the circle
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .insert({ ...input, created_by: user!.id })
        .select()
        .single()
      if (circleError) throw circleError

      // 2. auto-join as admin
      const { error: memberError } = await supabase
        .from('circle_memberships')
        .insert({ circle_id: circle.id, user_id: user!.id, role: 'admin' })
      if (memberError) throw memberError

      return circle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] })
    },
  })
}
