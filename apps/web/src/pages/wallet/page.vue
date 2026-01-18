<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { Wallet } from 'lucide-vue-next'
import { supabase } from '@/shared/supabase'
import { Skeleton } from '@/shared/components/ui/skeleton'
import TransactionsListPreview from './components/transactions-list-preview.vue'
import WalletBalanceDisplay from './components/wallet-balance-display.vue'
import QuickActionButtons from './components/quick-action-buttons.vue'

const route = useRoute()
const walletId = route.params.id as string

const wallet = useQuery({
  queryKey: ['wallets', { id: walletId }],
  async queryFn() {
    const res = await supabase
      .from('wallets')
      .select(
        `
        id,
        name,
        description,
        balances:wallet_balances (
          id,
          balance,
          currency_code
        )
        `
      )
      .eq('id', walletId)
      .single()

    if (res.error) {
      throw res.error
    }

    return res.data
  },
})

const walletData = computed(() => wallet.data.value)
</script>

<template>
  <div>
    <header class="mb-6">
      <div v-if="wallet.isPending.value" class="flex items-center gap-3">
        <Skeleton class="h-8 w-8 rounded-lg" />
        <div class="space-y-1">
          <Skeleton class="h-5 w-32" />
          <Skeleton class="h-4 w-48" />
        </div>
      </div>
      <div v-else-if="wallet.isError.value" class="text-destructive">Failed to load wallet</div>
      <div v-else class="flex items-center gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Wallet class="h-4 w-4 text-primary" />
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold leading-tight">
            {{ walletData?.name }}
          </h1>
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <WalletBalanceDisplay :balances="walletData?.balances ?? []" />
          </div>
        </div>
      </div>
    </header>

    <QuickActionButtons :wallet-id="walletId" />
    <TransactionsListPreview :wallet-id="walletId" class="mt-6" />
  </div>
</template>
