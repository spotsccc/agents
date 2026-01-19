<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'

const model = defineModel<string | null>()

const { data: currencies, isPending } = useQuery({
  queryKey: ['currencies'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('currencies')
      .select('code, name, symbol')
      .eq('active', true)
      .order('code')

    if (error) throw error
    return data
  },
})

function handleChange(value: unknown) {
  if (typeof value !== 'string') return
  model.value = value === 'all' ? null : value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Currency</Label>
    <Select :model-value="model ?? 'all'" @update:model-value="handleChange">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="All currencies" />
      </SelectTrigger>
      <SelectContent>
        <template v-if="isPending">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p>
        </template>
        <template v-else>
          <SelectItem value="all">All currencies</SelectItem>
          <SelectItem v-for="currency in currencies" :key="currency.code" :value="currency.code">
            {{ currency.code }} - {{ currency.name }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </div>
</template>
