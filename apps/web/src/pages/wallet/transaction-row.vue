<script setup lang="ts">

import type { Transaction } from "@/shared/supabase";

defineProps<{
  transaction: Transaction
}>()

</script>

<template>
  <div class="border-2">
    <p>{{ transaction.type }}</p>
    <p v-for="entry in transaction.entries" :key="entry.id">{{ entry.amount }}</p>
  </div>
</template>

<style scoped>

</style>
