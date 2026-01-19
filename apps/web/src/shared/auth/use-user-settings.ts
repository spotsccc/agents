import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { supabase, type UserSettings } from '@/shared/supabase'
import { useUser } from './use-user'

export function useUserSettings() {
  const { user } = useUser()

  const query = useQuery({
    queryKey: ['userSettings', computed(() => user.value?.id)],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user.value) return null

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.value.id)
        .single()

      // PGRST116 = "The result contains 0 rows" - user_settings not found
      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
    enabled: computed(() => !!user.value),
  })

  const onboardingFinished = computed(() => query.data.value?.onboarding_finished ?? false)

  return {
    settings: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    onboardingFinished,
    refetch: query.refetch,
  }
}

export function useCompleteOnboarding() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['complete_onboarding'],
    mutationFn: async () => {
      if (!user.value) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_settings')
        .update({ onboarding_finished: true })
        .eq('user_id', user.value.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
    },
  })
}
