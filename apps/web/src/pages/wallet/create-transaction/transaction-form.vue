<script setup lang="ts">
import {
  type CreateIncomeTransactionRequest,
  CREATE_INCOME_TRANSACTION,
} from 'supabase/create-income-transaction'
import {
  type CreateExpenseTransactionRequest,
  CREATE_EXPENSE_TRANSACTION,
} from 'supabase/create-expense-transaction'
import { Input } from '@/shared/components/ui/input'
import VSelect from '@/shared/components/ui/select/v-select.vue'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { supabase } from '@/shared/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/shared/auth/use-user'
import Button from '@/shared/components/ui/button/button.vue'
import IncomeSourceSelect from './income-source-select.vue'
import CategorySelect from './category-select.vue'

const props = defineProps<{ walletId: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const { user } = useUser()

const transactionTypes = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
]

const schema = z
  .object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    description: z.string(),
    type: z.enum(['income', 'expense', 'transfer', 'exchange']),
    categoryId: z.string().optional(),
    sourceId: z.string().optional(),
  })
  .refine((data) => data.type !== 'income' || !!data.sourceId, {
    message: 'Income source is required',
    path: ['sourceId'],
  })
  .refine((data) => data.type !== 'expense' || !!data.categoryId, {
    message: 'Category is required',
    path: ['categoryId'],
  })

type FormValues = z.infer<typeof schema>

const { handleSubmit, errors, defineField } = useForm<FormValues>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    amount: 0,
    currency: 'USD',
    description: '',
    type: 'expense',
    sourceId: undefined,
    categoryId: undefined,
  },
})

const [amount] = defineField('amount')
const [type] = defineField('type')
const [currency] = defineField('currency')
const [categoryId] = defineField('categoryId')
const [sourceId] = defineField('sourceId')

const { data: currencies, isPending: currenciesLoading } = useQuery({
  queryKey: ['currencies'],
  queryFn: async () => {
    const { data, error } = await supabase.from('currencies').select()
    if (error) throw error
    return data
  },
})

const currencyItems = computed(
  () => currencies.value?.map((c) => ({ id: c.code, label: c.code })) ?? []
)

const invalidateAndNavigate = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['walletTransactions', props.walletId] }),
    queryClient.invalidateQueries({ queryKey: ['wallets', { id: props.walletId }] }),
  ])
  router.push({ name: 'wallet', params: { id: props.walletId } })
}

const { mutateAsync: createIncome, isPending: isIncomeSubmitting } = useMutation({
  mutationFn: async (params: CreateIncomeTransactionRequest) => {
    const { data, error } = await supabase.functions.invoke(CREATE_INCOME_TRANSACTION, {
      body: params,
    })
    if (error) throw error
    return data
  },
  onSuccess: invalidateAndNavigate,
})

const { mutateAsync: createExpense, isPending: isExpenseSubmitting } = useMutation({
  mutationFn: async (params: CreateExpenseTransactionRequest) => {
    const { data, error } = await supabase.functions.invoke(CREATE_EXPENSE_TRANSACTION, {
      body: params,
    })
    if (error) throw error
    return data
  },
  onSuccess: invalidateAndNavigate,
})

const isSubmitting = computed(() => isIncomeSubmitting.value || isExpenseSubmitting.value)

const onSubmit = handleSubmit(async (values) => {
  if (!user.value) return

  const baseParams = {
    userId: user.value.id,
    walletId: props.walletId,
    amount: values.amount,
    currency: values.currency,
    description: values.description,
  }

  if (values.type === 'income') {
    await createIncome({ ...baseParams, sourceId: values.sourceId! })
  } else if (values.type === 'expense') {
    await createExpense({ ...baseParams, categoryId: values.categoryId! })
  }
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-2">
    <VSelect id="type" v-model="type" :items="transactionTypes" label="Transaction type" />

    <VSelect
      id="currency"
      v-model="currency"
      :items="currencyItems"
      :loading="currenciesLoading"
      :error="errors.currency"
      label="Currency"
    />

    <Input id="amount" v-model="amount" type="number" label="Amount" :error="errors.amount" />

    <CategorySelect
      v-if="type === 'expense'"
      v-model="categoryId"
      label="Category"
      :error="errors.categoryId"
    />

    <IncomeSourceSelect
      v-if="type === 'income'"
      v-model="sourceId"
      label="Income Source"
      :error="errors.sourceId"
    />

    <Button type="submit" class="w-full" :disabled="isSubmitting">
      {{ isSubmitting ? 'Creating...' : 'Create' }}
    </Button>
  </form>
</template>
