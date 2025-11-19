<script setup lang="ts">
import { computed, ref } from "vue"

import PromptConfigPanel from "@/components/PromptConfigPanel.vue"
import PromptResultCard from "@/components/PromptResultCard.vue"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { PromptConfig, PromptResult } from "@/types/promt-ab"

const defaultConfigA: PromptConfig = {
  systemPrompt:
    "You are Variant A: a precise assistant that focuses on concise, factual answers.",
  temperature: 0.6,
  topP: 0.9,
  topK: 50,
  maxOutputTokens: 256,
  presencePenalty: 0,
  frequencyPenalty: 0,
}

const defaultConfigB: PromptConfig = {
  systemPrompt:
    "You are Variant B: a creative strategist that replies with structured and insightful reasoning.",
  temperature: 0.8,
  topP: 0.95,
  topK: 60,
  maxOutputTokens: 256,
  presencePenalty: 0.3,
  frequencyPenalty: 0.1,
}

const mainPrompt = ref(
  "Draft an outline for a blog post that explains why prompt A/B testing matters for AI teams.",
)
const configA = ref<PromptConfig>({ ...defaultConfigA })
const configB = ref<PromptConfig>({ ...defaultConfigB })
const isTesting = ref(false)
const results = ref<PromptResult[]>([])

const hasResults = computed(() => results.value.length === 2)
const winningVariant = computed(() => {
  if (!hasResults.value) return null
  return [...results.value].sort((a, b) => b.score - a.score)[0]
})

const canRunTest = computed(() => Boolean(mainPrompt.value.trim()) && !isTesting.value)

function handlePromptChange(value: string | number) {
  mainPrompt.value = String(value)
}

async function runAbTest() {
  if (!canRunTest.value) return
  isTesting.value = true
  results.value = []

  const promptSnapshot = mainPrompt.value.trim()

  const [resultA, resultB] = await Promise.all([
    mockVariantResult("A", configA.value, promptSnapshot),
    mockVariantResult("B", configB.value, promptSnapshot),
  ])

  results.value = [resultA, resultB]
  isTesting.value = false
}

async function mockVariantResult(
  variant: PromptResult["variant"],
  config: PromptConfig,
  prompt: string,
): Promise<PromptResult> {
  const latencyMs = Math.round(400 + Math.random() * 600)
  await new Promise((resolve) => setTimeout(resolve, latencyMs))

  const tuningFactor =
    config.temperature * 1.2 - config.frequencyPenalty * 0.4 + config.presencePenalty * 0.2
  const randomFactor = (Math.random() - 0.5) * 2
  const score = Math.min(10, Math.max(0, 6 + tuningFactor + randomFactor))

  return {
    variant,
    score: Number(score.toFixed(1)),
    response: `(${variant}) ${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}`,
    latencyMs,
    tokensUsed: Math.round(120 + Math.random() * 180),
    promptPreview: prompt.slice(0, 60) + (prompt.length > 60 ? "..." : ""),
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 lg:py-12">
    <header class="space-y-3">
      <p class="text-sm font-medium text-primary">Prompt experiments</p>
      <h1 class="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Compare two system prompts and decoding settings side by side
      </h1>
      <p class="text-muted-foreground text-base">
        Configure variants, provide a single user prompt, and review mocked scores to see which setup
        performs better before rolling changes into production.
      </p>
    </header>

    <section class="grid gap-6 lg:grid-cols-2">
      <PromptConfigPanel
        v-model="configA"
        title="Variant A"
        description="Baselines with precise tone"
      />
      <PromptConfigPanel
        v-model="configB"
        title="Variant B"
        description="Exploratory or creative tone"
      />
    </section>

    <section>
      <Card>
        <CardHeader>
          <CardTitle>Main prompt</CardTitle>
          <CardDescription>All variants receive the same user intent.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Textarea
            :model-value="mainPrompt"
            class="min-h-40"
            placeholder="What would you like both variants to answer?"
            @update:model-value="handlePromptChange"
          />
          <div class="flex flex-wrap items-center gap-3">
            <Button :disabled="!canRunTest" @click="runAbTest">
              <span v-if="!isTesting">Run A/B test</span>
              <span v-else>Running...</span>
            </Button>
            <p class="text-sm text-muted-foreground">
              Results are mocked. Expect subtle differences each run.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Results</h2>
          <p class="text-sm text-muted-foreground">
            We assign a random score from 0–10 plus simple latency/tokens metrics.
          </p>
        </div>
        <div v-if="hasResults" class="text-sm">
          <span class="text-muted-foreground">Winning variant:</span>
          <span class="font-semibold text-foreground">
            {{ winningVariant?.variant === "A" ? "Variant A" : "Variant B" }}
          </span>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <PromptResultCard
          label="Variant A"
          :result="results.find((result) => result.variant === 'A')"
          :is-winner="winningVariant?.variant === 'A'"
        />
        <PromptResultCard
          label="Variant B"
          :result="results.find((result) => result.variant === 'B')"
          :is-winner="winningVariant?.variant === 'B'"
        />
      </div>
    </section>
  </div>
</template>