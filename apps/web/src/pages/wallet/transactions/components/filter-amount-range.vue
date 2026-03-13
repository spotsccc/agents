<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useDebounceFn } from '@vueuse/core'

const amountMin = defineModel<number | null>('amountMin')
const amountMax = defineModel<number | null>('amountMax')

const localMin = ref(amountMin.value?.toString() ?? '')
const localMax = ref(amountMax.value?.toString() ?? '')

const debouncedUpdateMin = useDebounceFn((value: string) => {
  amountMin.value = value ? parseFloat(value) : null
}, 300)

const debouncedUpdateMax = useDebounceFn((value: string) => {
  amountMax.value = value ? parseFloat(value) : null
}, 300)

function handleMinChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localMin.value = value
  debouncedUpdateMin(value)
}

function handleMaxChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localMax.value = value
  debouncedUpdateMax(value)
}

watch(amountMin, (value) => {
  localMin.value = value?.toString() ?? ''
})

watch(amountMax, (value) => {
  localMax.value = value?.toString() ?? ''
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Amount range</Label>
    <div class="flex gap-2">
      <Input
        id="filter-amount-min"
        type="number"
        :value="localMin"
        placeholder="Min"
        aria-label="Minimum amount"
        step="0.01"
        min="0"
        @input="handleMinChange"
      />
      <Input
        id="filter-amount-max"
        type="number"
        :value="localMax"
        placeholder="Max"
        aria-label="Maximum amount"
        step="0.01"
        min="0"
        @input="handleMaxChange"
      />
    </div>
  </div>
</template>
