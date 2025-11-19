<script setup lang="ts">

import type {Transaction} from "@/shared/supabase/transaction.ts";
import VText from "@/shared/ui/text/ui.vue";

defineProps<{
  transaction: Transaction
}>()

</script>

<template>
  <div class="border-2">
    <VText>{{ transaction.kind }}</VText>
    <VText v-for="entry in transaction.entries" :key="entry.id">{{ entry.amount }}</VText>
  </div>
</template>

<style scoped>

</style>
