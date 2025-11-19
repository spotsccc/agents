<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { computed } from "vue"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PromptConfig } from "@/types/promt-ab"

const props = defineProps<{
  title: string
  description?: string
  modelValue: PromptConfig
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: PromptConfig): void
}>()

const config = useVModel(props, "modelValue", emits, { passive: true })

const titleSlug = computed(() =>
  props.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
)

const numberFields = computed(() => [
  {
    key: "temperature",
    label: "Temperature",
    min: 0,
    max: 2,
    step: 0.1,
    hint: "Higher values add more randomness.",
  },
  {
    key: "topP",
    label: "Top P",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "Probability threshold for nucleus sampling.",
  },
  {
    key: "topK",
    label: "Top K",
    min: 1,
    max: 200,
    step: 1,
    hint: "Limit of tokens to sample from.",
  },
  {
    key: "maxOutputTokens",
    label: "Max output tokens",
    min: 16,
    max: 2048,
    step: 8,
    hint: "Upper bound for response length.",
  },
  {
    key: "presencePenalty",
    label: "Presence penalty",
    min: -2,
    max: 2,
    step: 0.1,
    hint: "Discourages repeating existing topics.",
  },
  {
    key: "frequencyPenalty",
    label: "Frequency penalty",
    min: -2,
    max: 2,
    step: 0.1,
    hint: "Discourages repeating exact tokens.",
  },
])

type NumericField = Exclude<keyof PromptConfig, "systemPrompt">

function updateConfig(partial: Partial<PromptConfig>) {
  config.value = { ...config.value, ...partial }
}

function handleNumericChange(field: NumericField, value: string | number) {
  const numericValue = typeof value === "number" ? value : parseFloat(value)
  if (Number.isNaN(numericValue)) {
    return
  }
  updateConfig({ [field]: numericValue } as Partial<PromptConfig>)
}
</script>

<template>
  <Card>
    <CardHeader class="gap-1 space-y-1">
      <CardTitle class="text-lg font-semibold">{{ title }}</CardTitle>
      <CardDescription>
        {{ description ?? "Tune system prompt and decoding parameters." }}
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Label :for="`${titleSlug}-system`">System / role prompt</Label>
        <Textarea
          :id="`${titleSlug}-system`"
          :model-value="config.systemPrompt"
          class="min-h-28"
          placeholder="Explain how the assistant should behave..."
          @update:model-value="(value) => updateConfig({ systemPrompt: String(value) })"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div v-for="field in numberFields" :key="field.key" class="space-y-2">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <Label :for="`${titleSlug}-${field.key}`" class="text-sm font-medium text-foreground">{{
              field.label
            }}</Label>
            <span>{{ config[field.key as NumericField] }}</span>
          </div>
          <Input
            :id="`${titleSlug}-${field.key}`"
            type="number"
            :step="field.step"
            :min="field.min"
            :max="field.max"
            :model-value="config[field.key as NumericField]"
            inputmode="decimal"
            @update:model-value="(value) => handleNumericChange(field.key as NumericField, value)"
          />
          <p class="text-xs text-muted-foreground">
            {{ field.hint }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

