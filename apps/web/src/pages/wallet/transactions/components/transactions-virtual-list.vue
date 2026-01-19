<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import {
  TransactionListItem,
  TransactionListItemSkeleton,
} from '@/components/transaction-list-item'
import type { TransactionFilters } from '../composables/use-transaction-filters'
import type { Transaction } from '../types'

const props = defineProps<{
  transactions: Transaction[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  filters: TransactionFilters
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const parentRef = ref<HTMLElement | null>(null)
const ITEM_HEIGHT = 72
const OVERSCAN = 5

const count = computed(() => props.transactions.length)

const virtualizer = useVirtualizer({
  get count() {
    return count.value
  },
  getScrollElement: () => parentRef.value,
  estimateSize: () => ITEM_HEIGHT,
  overscan: OVERSCAN,
})

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

// Scroll to top when filters change
watch(
  () => props.filters,
  () => {
    if (parentRef.value) {
      parentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  { deep: true }
)

// Infinite scroll: load more when reaching the end
function handleScroll() {
  if (!parentRef.value || props.isFetchingNextPage || !props.hasNextPage) return

  const { scrollTop, scrollHeight, clientHeight } = parentRef.value
  const scrollThreshold = scrollHeight - clientHeight - ITEM_HEIGHT * 3

  if (scrollTop >= scrollThreshold) {
    emit('loadMore')
  }
}

onMounted(() => {
  parentRef.value?.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  parentRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div
    ref="parentRef"
    class="h-[calc(100vh-320px)] min-h-[400px] overflow-auto"
    role="list"
    aria-label="Transactions list"
  >
    <template v-if="isLoading">
      <TransactionListItemSkeleton v-for="i in 10" :key="i" />
    </template>

    <template v-else-if="isError">
      <div class="flex h-full items-center justify-center">
        <p class="text-destructive">Failed to load transactions</p>
      </div>
    </template>

    <template v-else-if="transactions.length === 0">
      <div class="flex h-full items-center justify-center">
        <p class="text-muted-foreground">No transactions found</p>
      </div>
    </template>

    <template v-else>
      <div
        :style="{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in virtualItems"
          :key="String(virtualRow.key)"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
        >
          <TransactionListItem :transaction="transactions[virtualRow.index]" />
        </div>
      </div>

      <div v-if="isFetchingNextPage" class="flex justify-center py-4" aria-live="polite">
        <TransactionListItemSkeleton />
      </div>
    </template>
  </div>
</template>
