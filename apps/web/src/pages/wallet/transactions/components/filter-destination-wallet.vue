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

const props = defineProps<{
  currentWalletId: string
}>()

const model = defineModel<string | null>()

const { user } = useUser()

const { data: wallets, isPending } = useQuery({
  queryKey: ['wallets'],
  queryFn: async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('wallets')
      .select('id, name')
      .eq('user_id', user.value.id)
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data
  },
  enabled: computed(() => !!user.value),
})

const filteredWallets = computed(() => {
  return wallets.value?.filter((w) => w.id !== props.currentWalletId) ?? []
})

function handleChange(value: unknown) {
  if (typeof value !== 'string') return
  model.value = value === 'all' ? null : value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label class="text-sm">Destination Wallet</Label>
    <Select :model-value="model ?? 'all'" @update:model-value="handleChange">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="All wallets" />
      </SelectTrigger>
      <SelectContent>
        <template v-if="isPending">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p>
        </template>
        <template v-else>
          <SelectItem value="all">All wallets</SelectItem>
          <SelectItem v-for="wallet in filteredWallets" :key="wallet.id" :value="wallet.id">
            {{ wallet.name }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </div>
</template>
