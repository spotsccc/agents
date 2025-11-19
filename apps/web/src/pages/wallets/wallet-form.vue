<script setup lang="ts">

import {z} from "zod";
import {useForm} from "vee-validate";
import {toTypedSchema} from "@vee-validate/zod";
import {useMutation, useQueryClient} from "@tanstack/vue-query";
import {useUser} from "@/shared/auth/use-user.ts";
import type {InsertWallet} from "@/shared/supabase/wallets.ts";
import {Input} from "@/shared/components/ui/input";
import {Textarea} from "@/shared/components/ui/textarea";
import {Button} from "@/shared/components/ui/button";
import {supabase} from "@/shared/supabase";

const user = useUser();
const queryClient = useQueryClient();

const createWalletMutation = useMutation({
  mutationFn: async (wallet: Pick<InsertWallet, 'name' | 'description'>) => {
    if (!user.data.value) {
      throw new Error('User not found');
    }

    const res = await supabase.from('wallets').insert({
      ...wallet,
      user_id: user.data.value.id,
    })

    if (res.error) {
      throw res.error;
    }

    return res.data;
  },
  onSuccess() {
    queryClient.invalidateQueries({queryKey: ['wallets']});
  }
})

const scheme = z.object({
  name: z.string().min(3),
  description: z.string(),
})

const {handleSubmit, defineField, errors} = useForm({
  validationSchema: toTypedSchema(scheme),
  initialValues: {
    name: '',
    description: '',
  }
})

const onSubmit = handleSubmit(async values => {
  await createWalletMutation.mutateAsync(values);
})

const [name] = defineField('name');
const [description] = defineField('description');

</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
    <Input id="name" v-model="name" :error="errors.name" label="Name" placeholder="name"/>
    <Textarea v-model="description" placeholder="description"/>
    <Button type="submit">Create wallet</Button>
  </form>
</template>

<style scoped>

</style>
