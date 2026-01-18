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
import IncomeSourceForm from './income-source-form.vue'
import type { Tables } from 'supabase/scheme'

type IncomeSource = Tables<'income_sources'>

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [source: IncomeSource]
}>()

const { isMobile } = useBreakpoint()

const title = 'Add Income Source'
const description = 'Create a new income source for your transactions'

function handleCreated(source: IncomeSource) {
  emit('created', source)
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
      <IncomeSourceForm @created="handleCreated" />
    </SheetContent>
  </Sheet>

  <Dialog v-else v-model:open="open">
    <DialogContent class="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <IncomeSourceForm @created="handleCreated" />
    </DialogContent>
  </Dialog>
</template>
