<script setup lang="ts">
import TransactionForm from '@/pages/wallet/create-transaction/transaction-form.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const walletId = route.params.id as string
</script>

<template>
  <TransactionForm :walletId />
</template>

<style scoped></style>
