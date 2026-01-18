<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { supabase } from '@/shared/supabase'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUser } from '@/shared/auth/use-user'
import { Input } from '@/shared/components/ui/input'
import Button from '@/shared/components/ui/button/button.vue'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { CircleAlert } from 'lucide-vue-next'
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

const submitError = ref<string | null>(null)

const { mutate, isPending } = useMutation({
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

    if (error) throw new Error(error.message)
    return data
  },
  onSuccess: (newCategory) => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    emit('created', newCategory)
  },
  onError: (error) => {
    submitError.value = error instanceof Error ? error.message : 'An unexpected error occurred'
  },
})

const onSubmit = handleSubmit((values) => {
  submitError.value = null
  mutate(values)
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-4 p-4">
    <Alert v-if="submitError" variant="destructive">
      <CircleAlert class="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ submitError }}</AlertDescription>
    </Alert>

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
