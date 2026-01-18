<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const walletId = computed(() => route.params.id as string)
</script>

<template>
  <div>
    <p>wallet transactions</p>
    <p>Wallet ID: {{ walletId }}</p>
  </div>
</template>
