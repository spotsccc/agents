<script setup lang="ts">
import type { Wallet } from '@/shared/supabase'

defineProps<{
  wallet: Wallet
}>()
</script>

<template>
  <div class="flex">
    <RouterLink :to="`/wallets/${wallet.id}`">
      <div class="flex">
        <p>{{ wallet.name }}</p>
      </div>
    </RouterLink>
  </div>
</template>
