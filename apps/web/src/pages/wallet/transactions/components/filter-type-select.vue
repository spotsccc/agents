<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { TRANSACTION_TYPES, type TransactionType } from '../composables/use-transaction-filters'

const model = defineModel<TransactionType | null>()

function handleChange(value: unknown) {
  if (typeof value !== 'string') return
  model.value = value === 'all' ? null : (value as TransactionType)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Type</Label>
    <Select :model-value="model ?? 'all'" @update:model-value="handleChange">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="All types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All types</SelectItem>
        <SelectItem v-for="type in TRANSACTION_TYPES" :key="type.value" :value="type.value">
          {{ type.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
