<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { useUser } from '@/shared/auth/use-user'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import IncomeSourceModal from './income-source-modal.vue'

const props = defineProps<{
  label?: string
  error?: string
}>()

const model = defineModel<string>()

const { user } = useUser()
const showModal = ref(false)

const { data: incomeSources, isPending } = useQuery({
  queryKey: ['incomeSources'],
  queryFn: async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user.value.id)
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data
  },
  enabled: computed(() => !!user.value),
})

const items = computed(
  () =>
    incomeSources.value?.map((source) => ({
      id: source.id,
      label: source.name,
    })) ?? []
)

function handleSourceCreated(source: { id: string }) {
  model.value = source.id
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <Label v-if="props.label" class="text-sm">{{ props.label }}</Label>

    <Select v-model="model">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="Select income source" />
      </SelectTrigger>
      <SelectContent>
        <template v-if="isPending">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p>
        </template>
        <template v-else-if="items.length === 0">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">No sources yet</p>
        </template>
        <template v-else>
          <SelectItem v-for="item in items" :key="item.id" :value="item.id">
            {{ item.label }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>

    <button
      type="button"
      class="text-sm text-primary hover:underline text-left"
      @click="showModal = true"
    >
      + Add new source
    </button>

    <p v-if="props.error" class="text-xs text-destructive">{{ props.error }}</p>

    <IncomeSourceModal v-model:open="showModal" @created="handleSourceCreated" />
  </div>
</template>
