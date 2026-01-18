<script setup lang="ts">
import { Skeleton } from '@/shared/components/ui/skeleton'
</script>

<template>
  <li class="flex items-center gap-3 rounded-lg p-3" aria-hidden="true">
    <!-- Icon placeholder -->
    <Skeleton class="h-10 w-10 shrink-0 rounded-full" />

    <!-- Content placeholder -->
    <div class="min-w-0 flex-1 space-y-1.5">
      <Skeleton class="h-4 w-32" />
      <Skeleton class="h-3 w-24" />
    </div>

    <!-- Amount placeholder -->
    <div class="shrink-0 space-y-1.5 text-right">
      <Skeleton class="ml-auto h-4 w-20" />
      <Skeleton class="ml-auto h-3 w-16" />
    </div>
  </li>
</template>
