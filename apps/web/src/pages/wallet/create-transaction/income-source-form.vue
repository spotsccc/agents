<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { supabase } from '@/shared/supabase'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUser } from '@/shared/auth/use-user'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import Button from '@/shared/components/ui/button/button.vue'
import type { Tables } from 'supabase/scheme'

type IncomeSource = Tables<'income_sources'>

const emit = defineEmits<{
  created: [source: IncomeSource]
}>()

const { user } = useUser()
const queryClient = useQueryClient()

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  is_recurring: z.boolean(),
  icon: z.string().max(50).optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const { handleSubmit, errors, defineField } = useForm<FormValues>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: '',
    description: '',
    is_recurring: false,
    icon: '',
    color: '',
  },
})

const [name] = defineField('name')
const [description] = defineField('description')
const [isRecurring] = defineField('is_recurring')
const [icon] = defineField('icon')
const [color] = defineField('color')

const { mutateAsync, isPending } = useMutation({
  mutationFn: async (values: FormValues) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('income_sources')
      .insert({
        user_id: user.value.id,
        name: values.name,
        description: values.description || null,
        is_recurring: values.is_recurring,
        icon: values.icon || null,
        color: values.color || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
  onSuccess: (newSource) => {
    queryClient.invalidateQueries({ queryKey: ['incomeSources'] })
    emit('created', newSource)
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
      placeholder="e.g. Salary, Freelance"
      :error="errors.name"
    />

    <div class="flex flex-col gap-1">
      <Label for="description" class="text-sm">Description</Label>
      <Textarea id="description" v-model="description" placeholder="Optional description" />
      <p v-if="errors.description" class="text-xs text-destructive">
        {{ errors.description }}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <Checkbox id="is_recurring" v-model:checked="isRecurring" />
      <Label for="is_recurring" class="text-sm cursor-pointer"> Recurring income </Label>
    </div>

    <Input
      id="icon"
      v-model="icon"
      label="Icon"
      placeholder="e.g. briefcase, dollar-sign"
      :error="errors.icon"
    />

    <Input id="color" v-model="color" label="Color" placeholder="#FF5733" :error="errors.color" />

    <Button type="submit" class="w-full" :disabled="isPending">
      {{ isPending ? 'Creating...' : 'Create Source' }}
    </Button>
  </form>
</template>
