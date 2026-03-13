<script setup lang="ts">
import { useId } from 'vue'
import { X } from 'lucide-vue-next'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import VSelect from '@/shared/components/ui/select/v-select.vue'
import type { Item } from '@/shared/components/ui/select/type'

defineProps<{
  currencyItems: Item[]
  currenciesLoading: boolean
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const currency = defineModel<string>('currency', { required: true })
const amount = defineModel<number>('amount', { required: true })

const amountId = useId()
</script>

<template>
  <div class="flex items-end gap-2">
    <div class="flex-1">
      <VSelect
        v-model="currency"
        :items="currencyItems"
        :loading="currenciesLoading"
        label="Currency"
        placeholder="Select currency"
      />
    </div>
    <div class="flex-1">
      <Input
        :id="amountId"
        v-model="amount"
        type="number"
        label="Amount"
        placeholder="0.00"
        min="0"
        step="0.01"
      />
    </div>
    <Button
      v-if="canRemove"
      type="button"
      variant="ghost"
      size="icon"
      class="shrink-0"
      @click="emit('remove')"
    >
      <X class="h-4 w-4" />
      <span class="sr-only">Remove balance</span>
    </Button>
  </div>
</template>
