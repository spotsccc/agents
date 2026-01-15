import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { type MaybeRefOrGetter, toValue } from 'vue'
import type { User } from '@supabase/supabase-js'
import { ref } from 'vue'

const user = ref<User | null>(null)

let resolveReady: () => void
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

supabase.auth.onAuthStateChange((_, session) => {
  user.value = session?.user ?? null
  resolveReady()
})

export function useUser() {
  return { user, readyPromise }
}

export function useLogOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['log_out'],
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [] }).catch(console.log)
    },
  })
}

export function useSignUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['sign_up'],
    mutationFn: async ({
      email,
      password,
    }: {
      email: MaybeRefOrGetter<string>
      password: MaybeRefOrGetter<string>
    }) => {
      const { error, data } = await supabase.auth.signUp({
        email: toValue(email),
        password: toValue(password),
      })
      if (error) {
        throw error
      }
      return data
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useSignIn(options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['sign_in'],
    mutationFn: async ({
      email,
      password,
    }: {
      email: MaybeRefOrGetter<string>
      password: MaybeRefOrGetter<string>
    }) => {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: toValue(email),
        password: toValue(password),
      })
      if (error) {
        throw error
      }
      return data
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      options?.onSuccess?.()
    },
  })
}
