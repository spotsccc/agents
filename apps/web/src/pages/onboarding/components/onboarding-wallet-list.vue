<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Wallet } from 'lucide-vue-next'
import { supabase } from '@/shared/supabase'
import { useUser } from '@/shared/auth/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

const { user } = useUser()

const { data: wallets, isPending } = useQuery({
  queryKey: ['wallets', user.value?.id],
  queryFn: async () => {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('wallets')
      .select(
        `
        id,
        name,
        description,
        wallet_balances (
          currency_code,
          balance
        )
      `
      )
      .eq('user_id', user.value.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
  enabled: () => !!user.value,
})

function formatBalance(balance: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(balance)
  } catch {
    // Fallback for invalid currency codes
    return `${balance.toFixed(2)} ${currency}`
  }
}
</script>

<template>
  <div class="space-y-3">
    <template v-if="isPending">
      <Skeleton class="h-20 w-full" />
    </template>

    <template v-else-if="wallets && wallets.length > 0">
      <Card v-for="wallet in wallets" :key="wallet.id">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Wallet class="h-4 w-4" />
            {{ wallet.name }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="wallet.description" class="mb-2 text-sm text-muted-foreground">
            {{ wallet.description }}
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="balance in wallet.wallet_balances"
              :key="balance.currency_code"
              class="rounded-md bg-muted px-2 py-1 text-sm font-medium"
            >
              {{ formatBalance(Number(balance.balance), balance.currency_code) }}
            </span>
            <span
              v-if="!wallet.wallet_balances || wallet.wallet_balances.length === 0"
              class="text-sm text-muted-foreground"
            >
              No balances
            </span>
          </div>
        </CardContent>
      </Card>
    </template>

    <template v-else>
      <p class="text-center text-sm text-muted-foreground">
        No wallets created yet. Create your first wallet below.
      </p>
    </template>
  </div>
</template>
