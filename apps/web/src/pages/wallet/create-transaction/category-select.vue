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
import CategoryModal from './category-modal.vue'

const props = defineProps<{
  label?: string
  error?: string
}>()

const model = defineModel<string>()

const { user } = useUser()
const showModal = ref(false)

const { data: categories, isPending } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.value.id)
      .order('name')

    if (error) throw error
    return data
  },
  enabled: computed(() => !!user.value),
})

const items = computed(
  () =>
    categories.value?.map((category) => ({
      id: category.id,
      label: category.name,
    })) ?? []
)

function handleCategoryCreated(category: { id: string }) {
  model.value = category.id
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <Label v-if="props.label" class="text-sm">{{ props.label }}</Label>

    <Select v-model="model">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <template v-if="isPending">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p>
        </template>
        <template v-else-if="items.length === 0">
          <p class="px-2 py-1.5 text-sm text-muted-foreground">No categories yet</p>
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
      + Add new category
    </button>

    <p v-if="props.error" class="text-xs text-destructive">{{ props.error }}</p>

    <CategoryModal v-model:open="showModal" @created="handleCategoryCreated" />
  </div>
</template>
