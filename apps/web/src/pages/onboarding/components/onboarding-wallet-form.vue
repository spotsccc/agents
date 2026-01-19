<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus } from 'lucide-vue-next'
import { useUser } from '@/shared/auth/use-user'
import { supabase } from '@/shared/supabase'
import { setupWalletWithBalance } from '@/shared/supabase/edge-functions'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import type { Item } from '@/shared/components/ui/select/type'
import OnboardingBalanceRow from './onboarding-balance-row.vue'

const emit = defineEmits<{
  success: []
}>()

const { user } = useUser()
const queryClient = useQueryClient()

// Fetch currencies
const { data: currencies, isPending: currenciesLoading } = useQuery({
  queryKey: ['currencies'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('currencies')
      .select('code, name, symbol')
      .eq('active', true)
      .order('code')
    if (error) throw error
    return data
  },
})

const currencyItems = computed<Item[]>(
  () =>
    currencies.value?.map((c) => ({
      id: c.code,
      label: c.symbol ? `${c.code} (${c.symbol})` : c.code,
    })) ?? []
)

// Balances state
type BalanceRow = { id: number; currency: string; amount: number }
const balanceIdCounter = ref(1)
const balances = ref<BalanceRow[]>([{ id: 0, currency: 'USD', amount: 0 }])

function addBalance() {
  balances.value.push({
    id: balanceIdCounter.value++,
    currency: '',
    amount: 0,
  })
}

function removeBalance(id: number) {
  balances.value = balances.value.filter((b) => b.id !== id)
}

// Form validation
const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string(),
})

const { handleSubmit, defineField, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: '',
    description: '',
  },
})

const [name] = defineField('name')
const [description] = defineField('description')

// Error state
const formError = ref<string | null>(null)

// Mutation
const mutation = useMutation({
  mutationFn: async (values: { name: string; description: string }) => {
    if (!user.value) throw new Error('User not found')

    // Validate balances
    const validBalances = balances.value.filter((b) => b.currency && b.amount >= 0)

    if (validBalances.length === 0) {
      throw new Error('At least one balance with currency is required')
    }

    const result = await setupWalletWithBalance({
      walletName: values.name,
      walletDescription: values.description || undefined,
      balances: validBalances.map((b) => ({
        currency: b.currency,
        amount: b.amount,
      })),
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return result.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
    resetForm()
    balances.value = [{ id: balanceIdCounter.value++, currency: 'USD', amount: 0 }]
    formError.value = null
    emit('success')
  },
  onError: (error) => {
    formError.value = error instanceof Error ? error.message : 'An error occurred'
  },
})

const onSubmit = handleSubmit((values) => {
  formError.value = null
  mutation.mutate(values)
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
    <Alert v-if="formError" variant="destructive">
      <AlertDescription>{{ formError }}</AlertDescription>
    </Alert>

    <Input
      id="wallet-name"
      v-model="name"
      :error="errors.name"
      label="Wallet Name"
      placeholder="My Wallet"
    />

    <Textarea v-model="description" label="Description" placeholder="Optional description" />

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">Balances</label>
        <Button type="button" variant="outline" size="sm" @click="addBalance">
          <Plus class="mr-1 h-4 w-4" />
          Add Currency
        </Button>
      </div>

      <div class="space-y-2">
        <OnboardingBalanceRow
          v-for="balance in balances"
          :key="balance.id"
          v-model:currency="balance.currency"
          v-model:amount="balance.amount"
          :currency-items="currencyItems"
          :currencies-loading="currenciesLoading"
          :can-remove="balances.length > 1"
          @remove="removeBalance(balance.id)"
        />
      </div>
    </div>

    <Button type="submit" :disabled="mutation.isPending.value" class="w-full">
      {{ mutation.isPending.value ? 'Creating...' : 'Create Wallet' }}
    </Button>
  </form>
</template>
