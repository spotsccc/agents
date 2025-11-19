import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import {type MaybeRefOrGetter, toValue} from "vue";

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    async queryFn() {
      const res = await supabase.auth.getUser();

      if (res.error) {
        throw res.error;
      }

      return res.data.user;
    }
  })
}

export function useLogOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['log_out'],
    mutationFn: async () => {
      const {error} = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({queryKey: []}).catch(console.log);
    }
  })
}

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['sign_up'],
    mutationFn: async ({email, password}: {
      email: MaybeRefOrGetter<string>;
      password: MaybeRefOrGetter<string>;
    }) => {
      const {error, data} = await supabase.auth.signUp({
        email: toValue(email),
        password: toValue(password),
      })
      if (error) {
        throw error;
      }
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({queryKey: ['user']});
    }
  })
}

export function useSignIn(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['sign_in'],
    mutationFn: async ({email, password}: {
      email: MaybeRefOrGetter<string>;
      password: MaybeRefOrGetter<string>;
    }) => {
      const {error, data} = await supabase.auth.signInWithPassword({
        email: toValue(email),
        password: toValue(password),
      })
      if (error) {
        throw error;
      }
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({queryKey: ['user']});
      options?.onSuccess?.()
    }
  })
}
