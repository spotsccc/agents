<script setup lang="ts">
import { useBreakpoint } from '@/shared/composables/use-breakpoint'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import CategoryForm from './category-form.vue'
import type { Tables } from 'supabase/scheme'

type Category = Tables<'categories'>

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [category: Category]
}>()

const { isMobile } = useBreakpoint()

const title = 'Add Category'
const description = 'Create a new expense category'

function handleCreated(category: Category) {
  emit('created', category)
  open.value = false
}
</script>

<template>
  <Sheet v-if="isMobile" v-model:open="open">
    <SheetContent side="bottom" class="h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ title }}</SheetTitle>
        <SheetDescription>{{ description }}</SheetDescription>
      </SheetHeader>
      <CategoryForm @created="handleCreated" />
    </SheetContent>
  </Sheet>

  <Dialog v-else v-model:open="open">
    <DialogContent class="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <CategoryForm @created="handleCreated" />
    </DialogContent>
  </Dialog>
</template>
