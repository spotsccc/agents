<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { supabase } from '@/shared/supabase'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUser } from '@/shared/auth/use-user'
import { Input } from '@/shared/components/ui/input'
import Button from '@/shared/components/ui/button/button.vue'
import type { Tables } from 'supabase/scheme'

type Category = Tables<'categories'>

const emit = defineEmits<{
  created: [category: Category]
}>()

const { user } = useUser()
const queryClient = useQueryClient()

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

type FormValues = z.infer<typeof schema>

const { handleSubmit, errors, defineField } = useForm<FormValues>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: '',
  },
})

const [name] = defineField('name')

const { mutateAsync, isPending } = useMutation({
  mutationFn: async (values: FormValues) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.value.id,
        name: values.name,
        type: 'expense',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
  onSuccess: (newCategory) => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    emit('created', newCategory)
  },
})

const onSubmit = handleSubmit((values) => mutateAsync(values))
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-4 p-4">
    <Input
      id="name"
      v-model="name"
      label="Name"
      placeholder="e.g. Food, Transport, Entertainment"
      :error="errors.name"
    />

    <Button type="submit" class="w-full" :disabled="isPending">
      {{ isPending ? 'Creating...' : 'Create Category' }}
    </Button>
  </form>
</template>
