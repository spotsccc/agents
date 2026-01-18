<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Wallet, Plus } from 'lucide-vue-next'
import { supabase } from '@/shared/supabase'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent } from '@/shared/components/ui/card'
import WalletCard from './components/wallet-card.vue'

const walletsQuery = useQuery({
  queryKey: ['wallets'],
  queryFn: async () => {
    const res = await supabase.from('wallets').select(
      `
      id,
      name,
      description,
      created_at,
      updated_at,
      deleted_at,
      metadata,
      primary_currency,
      settings,
      type,
      user_id,
      balances:wallet_balances (
        id,
        balance,
        currency_code
      )
      `
    )
    if (res.error) {
      throw res.error
    }
    return res.data
  },
})
</script>

<template>
  <div>
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wallet class="h-5 w-5 text-primary" />
        </div>
        <h1 class="text-xl font-semibold">Wallets</h1>
      </div>
      <Button as-child>
        <RouterLink :to="{ name: 'create-wallet' }">
          <Plus class="mr-2 h-4 w-4" />
          New Wallet
        </RouterLink>
      </Button>
    </header>

    <!-- Loading state -->
    <div v-if="walletsQuery.isPending.value" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-6">
          <div class="flex items-start gap-3">
            <Skeleton class="h-10 w-10 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-5 w-32" />
              <Skeleton class="h-4 w-48" />
            </div>
          </div>
          <Skeleton class="mt-4 h-4 w-24" />
        </CardContent>
      </Card>
    </div>

    <!-- Error state -->
    <div
      v-else-if="walletsQuery.isError.value"
      class="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 py-12"
    >
      <p class="text-destructive">Failed to load wallets</p>
      <Button variant="outline" class="mt-4" @click="walletsQuery.refetch()"> Try again </Button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="walletsQuery.data.value?.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border border-dashed py-12"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Wallet class="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 class="mt-4 font-medium">No wallets yet</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Create your first wallet to start tracking your finances
      </p>
      <Button as-child class="mt-4">
        <RouterLink :to="{ name: 'create-wallet' }">
          <Plus class="mr-2 h-4 w-4" />
          Create Wallet
        </RouterLink>
      </Button>
    </div>

    <!-- Wallets grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <WalletCard v-for="wallet in walletsQuery.data.value" :key="wallet.id" :wallet="wallet" />
    </div>
  </div>
</template>
