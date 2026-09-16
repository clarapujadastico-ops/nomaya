import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface PollOption {
  id: string
  label: string
  label_es: string
}

export interface Poll {
  id: string
  question: string
  question_es: string | null
  options: PollOption[]
  city: string | null
  multi_select: boolean
}

/** The single most recent active poll for this city (or a city-less/global one). */
export function useActivePoll(city: string) {
  return useQuery({
    queryKey: ['active_poll', city],
    queryFn: async (): Promise<Poll | null> => {
      const { data, error } = await supabase
        .from('polls')
        .select('id, question, question_es, options, city, multi_select')
        .eq('is_active', true)
        .or(`city.is.null,city.eq.${city}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Poll | null
    },
    enabled: !!city,
  })
}

export function useMyPollVotes(pollId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my_poll_votes', pollId, user?.id],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', pollId!)
        .eq('user_id', user!.id)
      if (error) throw error
      return (data ?? []).map((v) => v.option_id)
    },
    enabled: !!pollId && !!user,
  })
}

/** Tap-to-toggle voting, same immediate-persist pattern as the circle interest tags. */
export function useTogglePollVote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
      currentlySelected,
      multiSelect,
    }: {
      pollId: string
      optionId: string
      currentlySelected: boolean
      multiSelect: boolean
    }) => {
      if (currentlySelected) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', user!.id)
          .eq('option_id', optionId)
        return
      }
      if (!multiSelect) {
        // Single-select: clear any other choice first so only one sticks.
        await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', user!.id)
      }
      await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: user!.id, option_id: optionId })
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my_poll_votes', vars.pollId, user?.id] })
    },
  })
}
