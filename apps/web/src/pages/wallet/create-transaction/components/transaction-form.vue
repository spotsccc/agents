<script setup lang="ts">
import { Input } from '@/shared/components/ui/input'
import VSelect from '@/shared/components/ui/select/v-select.vue'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { supabase } from '@/shared/supabase'
import {
  createIncomeTransaction,
  createExpenseTransaction,
  createExchangeTransaction,
  createTransferTransaction,
  type CreateIncomeTransactionRequest,
  type CreateExpenseTransactionRequest,
  type CreateExchangeTransactionRequest,
  type CreateTransferTransactionRequest,
} from '@/shared/supabase/edge-functions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/shared/auth/use-user'
import Button from '@/shared/components/ui/button/button.vue'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { CircleAlert } from 'lucide-vue-next'
import IncomeSourceSelect from './income-source-select.vue'
import CategorySelect from './category-select.vue'
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from '@/shared/constants/transaction-types'

const props = defineProps<{
  walletId: string
  initialType?: TransactionType
}>()

const router = useRouter()
const queryClient = useQueryClient()
const { user } = useUser()

const transactionTypes = TRANSACTION_TYPES.map((type) => ({
  id: type,
  label: TRANSACTION_TYPE_LABELS[type],
}))

const schema = z
  .object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    description: z.string(),
    type: z.enum(TRANSACTION_TYPES),
    categoryId: z.string().optional(),
    sourceId: z.string().optional(),
    toCurrency: z.string().optional(),
    toAmount: z.number().optional(),
    toWalletId: z.string().optional(),
  })
  .refine((data) => data.type !== 'income' || !!data.sourceId, {
    message: 'Income source is required',
    path: ['sourceId'],
  })
  .refine((data) => data.type !== 'expense' || !!data.categoryId, {
    message: 'Category is required',
    path: ['categoryId'],
  })
  .refine((data) => data.type !== 'exchange' || !!data.toCurrency, {
    message: 'Target currency is required',
    path: ['toCurrency'],
  })
  .refine((data) => data.type !== 'exchange' || (data.toAmount && data.toAmount > 0), {
    message: 'Amount to receive must be positive',
    path: ['toAmount'],
  })
  .refine((data) => data.type !== 'exchange' || data.currency !== data.toCurrency, {
    message: 'Cannot exchange to the same currency',
    path: ['toCurrency'],
  })
  .refine((data) => data.type !== 'transfer' || !!data.toWalletId, {
    message: 'Destination wallet is required',
    path: ['toWalletId'],
  })
  .refine((data) => data.type !== 'transfer' || !!data.toCurrency, {
    message: 'Destination currency is required',
    path: ['toCurrency'],
  })
  .refine((data) => data.type !== 'transfer' || (data.toAmount && data.toAmount > 0), {
    message: 'Amount to receive must be positive',
    path: ['toAmount'],
  })

type FormValues = z.infer<typeof schema>

const { handleSubmit, errors, defineField } = useForm<FormValues>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    amount: 0,
    currency: 'USD',
    description: '',
    type: props.initialType ?? 'expense',
    sourceId: undefined,
    categoryId: undefined,
    toCurrency: undefined,
    toAmount: undefined,
    toWalletId: undefined,
  },
})

const [amount] = defineField('amount')
const [type] = defineField('type')
const [currency] = defineField('currency')
const [categoryId] = defineField('categoryId')
const [sourceId] = defineField('sourceId')
const [toCurrency] = defineField('toCurrency')
const [toAmount] = defineField('toAmount')
const [toWalletId] = defineField('toWalletId')

const submitError = ref<string | null>(null)

watch(type, () => {
  submitError.value = null
})

function handleMutationError(error: Error) {
  submitError.value = error.message
}

const { data: currencies, isPending: currenciesLoading } = useQuery({
  queryKey: ['currencies'],
  queryFn: async () => {
    const { data, error } = await supabase.from('currencies').select()
    if (error) throw error
    return data
  },
})

const { data: wallets, isPending: walletsLoading } = useQuery({
  queryKey: ['wallets'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (error) throw error
    return data
  },
})

const walletItems = computed(
  () =>
    wallets.value
      ?.filter((w) => w.id !== props.walletId)
      .map((w) => ({ id: w.id, label: w.name })) ?? []
)

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

const { mutate: invokeCreateIncome, isPending: isIncomeSubmitting } = useMutation({
  mutationFn: async (params: CreateIncomeTransactionRequest) => {
    const { data, error } = await createIncomeTransaction(params)
    if (error) throw new Error(error.message)
    return data
  },
  onSuccess: invalidateAndNavigate,
  onError: handleMutationError,
})

const { mutate: invokeCreateExpense, isPending: isExpenseSubmitting } = useMutation({
  mutationFn: async (params: CreateExpenseTransactionRequest) => {
    const { data, error } = await createExpenseTransaction(params)
    if (error) throw new Error(error.message)
    return data
  },
  onSuccess: invalidateAndNavigate,
  onError: handleMutationError,
})

const { mutate: invokeCreateExchange, isPending: isExchangeSubmitting } = useMutation({
  mutationFn: async (params: CreateExchangeTransactionRequest) => {
    const { data, error } = await createExchangeTransaction(params)
    if (error) throw new Error(error.message)
    return data
  },
  onSuccess: invalidateAndNavigate,
  onError: handleMutationError,
})

const { mutate: invokeCreateTransfer, isPending: isTransferSubmitting } = useMutation({
  mutationFn: async (params: CreateTransferTransactionRequest) => {
    const { data, error } = await createTransferTransaction(params)
    if (error) throw new Error(error.message)
    return data
  },
  onSuccess: invalidateAndNavigate,
  onError: handleMutationError,
})

const isSubmitting = computed(
  () =>
    isIncomeSubmitting.value ||
    isExpenseSubmitting.value ||
    isExchangeSubmitting.value ||
    isTransferSubmitting.value
)

const onSubmit = handleSubmit((values) => {
  if (!user.value) return

  submitError.value = null

  const baseParams = {
    userId: user.value.id,
    walletId: props.walletId,
    amount: values.amount,
    currency: values.currency,
    description: values.description,
  }

  if (values.type === 'income') {
    invokeCreateIncome({ ...baseParams, sourceId: values.sourceId! })
  } else if (values.type === 'expense') {
    invokeCreateExpense({ ...baseParams, categoryId: values.categoryId! })
  } else if (values.type === 'exchange') {
    invokeCreateExchange({
      userId: user.value.id,
      walletId: props.walletId,
      fromCurrency: values.currency,
      toCurrency: values.toCurrency!,
      fromAmount: values.amount,
      toAmount: values.toAmount!,
      description: values.description,
    })
  } else if (values.type === 'transfer') {
    invokeCreateTransfer({
      userId: user.value.id,
      fromWalletId: props.walletId,
      toWalletId: values.toWalletId!,
      fromCurrency: values.currency,
      toCurrency: values.toCurrency!,
      fromAmount: values.amount,
      toAmount: values.toAmount!,
      description: values.description,
    })
  }
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-2">
    <Alert v-if="submitError" variant="destructive" class="mb-2">
      <CircleAlert class="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ submitError }}</AlertDescription>
    </Alert>

    <VSelect id="type" v-model="type" :items="transactionTypes" label="Transaction type" />

    <VSelect
      id="currency"
      v-model="currency"
      :items="currencyItems"
      :loading="currenciesLoading"
      :error="errors.currency"
      :label="type === 'exchange' || type === 'transfer' ? 'From Currency' : 'Currency'"
    />

    <Input
      id="amount"
      v-model="amount"
      type="number"
      :label="type === 'exchange' || type === 'transfer' ? 'Amount to Send' : 'Amount'"
      :error="errors.amount"
    />

    <template v-if="type === 'exchange'">
      <VSelect
        id="toCurrency"
        v-model="toCurrency"
        :items="currencyItems"
        :loading="currenciesLoading"
        :error="errors.toCurrency"
        label="To Currency"
      />

      <Input
        id="toAmount"
        v-model="toAmount"
        type="number"
        label="Amount to Receive"
        :error="errors.toAmount"
      />
    </template>

    <template v-if="type === 'transfer'">
      <VSelect
        id="toWalletId"
        v-model="toWalletId"
        :items="walletItems"
        :loading="walletsLoading"
        :error="errors.toWalletId"
        label="Destination Wallet"
      />

      <VSelect
        id="toCurrency"
        v-model="toCurrency"
        :items="currencyItems"
        :loading="currenciesLoading"
        :error="errors.toCurrency"
        label="Destination Currency"
      />

      <Input
        id="toAmount"
        v-model="toAmount"
        type="number"
        label="Amount to Receive"
        :error="errors.toAmount"
      />
    </template>

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
