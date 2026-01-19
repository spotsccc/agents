<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { useUser } from '@/shared/auth/use-user'
import { useCompleteOnboarding } from '@/shared/auth/use-user-settings'
import { clearOnboardingCache } from '@/app/router'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import OnboardingWalletForm from './components/onboarding-wallet-form.vue'
import OnboardingWalletList from './components/onboarding-wallet-list.vue'

const router = useRouter()
const { user } = useUser()
const completeOnboarding = useCompleteOnboarding()

const showForm = ref(true)

// Query to check if user has wallets
const { data: wallets, refetch: refetchWallets } = useQuery({
  queryKey: ['wallets', user.value?.id],
  queryFn: async () => {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.value.id)
      .is('deleted_at', null)

    if (error) throw error
    return data
  },
  enabled: () => !!user.value,
})

const hasWallets = computed(() => (wallets.value?.length ?? 0) > 0)

function handleWalletCreated() {
  showForm.value = false
  refetchWallets()
}

function handleAddAnother() {
  showForm.value = true
}

async function handleFinish() {
  await completeOnboarding.mutateAsync()
  clearOnboardingCache()
  router.push({ name: 'wallets' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-lg space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold">Welcome!</h1>
        <p class="mt-2 text-muted-foreground">Let's set up your wallets to get started.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Wallets</CardTitle>
          <CardDescription>
            Create at least one wallet with your current balances.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <OnboardingWalletList />

          <div v-if="showForm" class="border-t pt-4">
            <h3 class="mb-4 text-sm font-medium">
              {{ hasWallets ? 'Add Another Wallet' : 'Create Your First Wallet' }}
            </h3>
            <OnboardingWalletForm @success="handleWalletCreated" />
          </div>

          <div v-else class="flex flex-col gap-2 border-t pt-4">
            <Button variant="outline" @click="handleAddAnother"> Add Another Wallet </Button>
            <Button
              :disabled="!hasWallets || completeOnboarding.isPending.value"
              @click="handleFinish"
            >
              {{ completeOnboarding.isPending.value ? 'Finishing...' : 'Finish Setup' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
