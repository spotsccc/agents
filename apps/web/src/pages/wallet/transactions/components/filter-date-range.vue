<script setup lang="ts">
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const dateFrom = defineModel<string | null>('dateFrom')
const dateTo = defineModel<string | null>('dateTo')

function handleDateFromChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  dateFrom.value = value || null
}

function handleDateToChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  dateTo.value = value || null
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Date range</Label>
    <div class="flex gap-2">
      <Input
        id="filter-date-from"
        type="date"
        :value="dateFrom ?? ''"
        placeholder="From"
        aria-label="Date from"
        @change="handleDateFromChange"
      />
      <Input
        id="filter-date-to"
        type="date"
        :value="dateTo ?? ''"
        placeholder="To"
        aria-label="Date to"
        @change="handleDateToChange"
      />
    </div>
  </div>
</template>
