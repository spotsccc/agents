<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { Button } from '@/shared/components/ui/button'
import TransactionsListPreview from './transactions-list-preview.vue'
import WalletBalanceDisplay from './wallet-balance-display.vue'

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
      .eq('id', route.params.id as string)
      .single()

    if (res.error) {
      throw res.error
    }

    return res.data
  },
})
</script>

<template>
  <p v-if="wallet.isPending.value">loading</p>
  <p v-else-if="wallet.isError.value">{{ wallet.error.value }}</p>
  <template v-else>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">Balances:</span>
      <WalletBalanceDisplay :balances="wallet.data.value!.balances" />
    </div>
    <div class="mt-4">
      <Button as-child>
        <RouterLink :to="`/wallets/${walletId}/transactions/create`">
          Create new transaction
        </RouterLink>
      </Button>
    </div>
    <TransactionsListPreview :wallet-id="walletId" class="mt-6" />
  </template>
</template>
