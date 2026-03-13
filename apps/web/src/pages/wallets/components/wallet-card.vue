<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import WalletBalanceDisplay from '@/pages/wallet/components/wallet-balance-display.vue'

interface Balance {
  id: string
  balance: number
  currency_code: string
}

interface WalletWithBalances {
  id: string
  name: string
  description: string | null
  balances: Balance[]
}

defineProps<{
  wallet: WalletWithBalances
}>()
</script>

<template>
  <RouterLink :to="`/wallets/${wallet.id}`" class="block">
    <Card
      class="group h-full transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/10"
    >
      <CardHeader class="pb-3">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Wallet class="h-5 w-5 text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <CardTitle class="truncate text-base">{{ wallet.name }}</CardTitle>
            <CardDescription v-if="wallet.description" class="mt-1 line-clamp-2">
              {{ wallet.description }}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WalletBalanceDisplay
          v-if="wallet.balances.length > 0"
          :balances="wallet.balances"
          :max-visible="2"
        />
        <p v-else class="text-sm text-muted-foreground">No balances</p>
        <p
          class="mt-3 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          View details →
        </p>
      </CardContent>
    </Card>
  </RouterLink>
</template>
