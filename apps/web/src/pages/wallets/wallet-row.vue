<script setup lang="ts">
import type {Wallet} from "@/shared/supabase/wallets.ts";
import VText from "@/shared/ui/text/ui.vue";

defineProps<{
  wallet: Wallet
}>()
</script>

<template>
  <div class="flex">
    <RouterLink :to="`/wallets/${wallet.id}`">
      <div class="flex">
        <VText>{{wallet.name}}</VText>
      </div>
    </RouterLink>
  </div>
</template>
