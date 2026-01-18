<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Plus } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import TransactionForm from '@/pages/wallet/create-transaction/transaction-form.vue'
import { isValidTransactionType } from '@/shared/constants/transaction-types'

const route = useRoute()

const walletId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : undefined
})

const initialType = computed(() => {
  const queryType = route.query.type
  if (typeof queryType === 'string' && isValidTransactionType(queryType)) {
    return queryType
  }
  return undefined
})

const backRoute = computed(() =>
  walletId.value ? { name: 'wallet', params: { id: walletId.value } } : { name: 'wallets' }
)
</script>

<template>
  <div v-if="walletId">
    <header class="mb-6">
      <div class="flex items-center gap-3">
        <Button as-child variant="ghost" size="icon" class="h-8 w-8 shrink-0">
          <RouterLink :to="backRoute">
            <ArrowLeft class="h-4 w-4" />
            <span class="sr-only">Back to wallet</span>
          </RouterLink>
        </Button>
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Plus class="h-4 w-4 text-primary" />
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold leading-tight">New Transaction</h1>
        </div>
      </div>
    </header>

    <TransactionForm :wallet-id="walletId" :initial-type="initialType" />
  </div>
  <div v-else class="text-destructive">Invalid wallet ID</div>
</template>
