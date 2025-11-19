<script setup lang="ts">
import { computed } from "vue"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { PromptResult } from "@/types/promt-ab"

const props = defineProps<{
  label: string
  result?: PromptResult
  isWinner?: boolean
}>()

const scoreValue = computed(() => props.result?.score ?? 0)
</script>

<template>
  <Card class="h-full">
    <CardHeader class="gap-1 space-y-1">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-lg">{{ label }}</CardTitle>
          <CardDescription>
            {{ result ? "Latest run" : "Run a test to generate insights" }}
          </CardDescription>
        </div>
        <Badge v-if="result" :variant="isWinner ? 'default' : 'outline'">
          {{ isWinner ? "Winner" : "Candidate" }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-5">
      <div v-if="result" class="space-y-2">
        <div class="text-sm text-muted-foreground">Score</div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-semibold tracking-tight">{{ scoreValue.toFixed(1) }}</span>
          <span class="text-muted-foreground text-sm">/ 10</span>
        </div>
        <Progress :model-value="Math.min(scoreValue * 10, 100)" />
      </div>
      <div v-else class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Results will appear here after you run an A/B test.
      </div>

      <div v-if="result" class="space-y-4">
        <div class="space-y-1">
          <p class="text-xs uppercase text-muted-foreground">Response preview</p>
          <p class="text-sm leading-relaxed text-foreground">
            {{ result.response }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg border bg-card/30 p-3">
            <p class="text-xs text-muted-foreground">Latency</p>
            <p class="text-lg font-medium">{{ result.latencyMs }} ms</p>
          </div>
          <div class="rounded-lg border bg-card/30 p-3">
            <p class="text-xs text-muted-foreground">Tokens used</p>
            <p class="text-lg font-medium">{{ result.tokensUsed }}</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          Prompt focus: {{ result.promptPreview }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

