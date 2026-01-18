<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import WalletForm from '../components/wallet-form.vue'

const router = useRouter()

function handleSuccess() {
  router.push({ name: 'wallets' })
}
</script>

<template>
  <div>
    <header class="mb-6">
      <div class="flex items-center gap-3">
        <Button as-child variant="ghost" size="icon" class="h-8 w-8 shrink-0">
          <RouterLink :to="{ name: 'wallets' }">
            <ArrowLeft class="h-4 w-4" />
            <span class="sr-only">Back to wallets</span>
          </RouterLink>
        </Button>
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold leading-tight">New Wallet</h1>
        </div>
      </div>
    </header>

    <WalletForm @success="handleSuccess" />
  </div>
</template>
