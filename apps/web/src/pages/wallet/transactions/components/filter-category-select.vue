<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { useUser } from '@/shared/auth/use-user'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'

const model = defineModel<string | null>()

const { user } = useUser()

const { data: categories, isPending } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.value.id)
      .order('name')

    if (error) throw error
    return data
  },
  enabled: computed(() => !!user.value),
})

function handleChange(value: unknown) {
  if (typeof value !== 'string') return
  model.value = value === 'all' ? null : value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Category</Label>
    <Select :model-value="model ?? 'all'" @update:model-value="handleChange">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <template v-if="isPending">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p>
        </template>
        <template v-else>
          <SelectItem value="all">All categories</SelectItem>
          <SelectItem v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </div>
</template>
