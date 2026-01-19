import { createRouter, createWebHistory } from 'vue-router'
import { SignUpPage } from '@/pages/auth/sign-up'
import { SignInPage } from '@/pages/auth/sign-in'
import { WalletsPage } from '@/pages/wallets'
import { WalletPage } from '@/pages/wallet'
import { WalletTransactionsPage } from '@/pages/wallet/transactions'
import AuthLayout from '@/shared/layouts/auth/auth-layout.vue'
import { CreateTransactionPage } from '@/pages/wallet/create-transaction'
import { CreateWalletPage } from '@/pages/wallets/create'
import { OnboardingPage } from '@/pages/onboarding'
import { useUser } from '../../shared/auth/use-user.ts'
import { supabase } from '@/shared/supabase'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      children: [
        {
          path: '/auth/sign-up',
          name: 'sign-up',
          component: SignUpPage,
        },
        {
          path: '/auth/sign-in',
          name: 'sign-in',
          component: SignInPage,
        },
      ],
      meta: {
        public: true,
      },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingPage,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: '/wallets',
          name: 'wallets',
          component: WalletsPage,
        },
        {
          path: '/wallets/create',
          name: 'create-wallet',
          component: CreateWalletPage,
        },
        {
          path: '/wallets/:id',
          name: 'wallet',
          component: WalletPage,
        },
        {
          path: '/wallets/:id/transactions',
          name: 'wallet-transactions',
          component: WalletTransactionsPage,
        },
        {
          path: '/wallets/:id/transactions/create',
          name: 'create-transaction',
          component: CreateTransactionPage,
        },
      ],
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/wallets',
    },
  ],
})

// Cache for user settings to avoid repeated fetches
let cachedOnboardingStatus: { userId: string; finished: boolean } | null = null

async function fetchOnboardingStatus(userId: string): Promise<boolean> {
  // Return cached value if for same user
  if (cachedOnboardingStatus?.userId === userId) {
    return cachedOnboardingStatus.finished
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('onboarding_finished')
      .eq('user_id', userId)
      .single()

    // If Supabase is unavailable or returns error, assume onboarding is finished
    // to prevent blocking authenticated users from accessing the app
    if (error) {
      console.error('Failed to fetch onboarding status:', error)
      return true
    }

    const finished = data?.onboarding_finished ?? false
    cachedOnboardingStatus = { userId, finished }
    return finished
  } catch (error) {
    console.error('Failed to fetch onboarding status:', error)
    // On network errors, assume onboarding is finished to not block users
    return true
  }
}

// Clear cache on auth state change
supabase.auth.onAuthStateChange(() => {
  cachedOnboardingStatus = null
})

// Export function to clear cache (called after completing onboarding)
export function clearOnboardingCache() {
  cachedOnboardingStatus = null
}

router.beforeEach(async (to, _from, next) => {
  const { user, readyPromise } = useUser()
  await readyPromise

  // Unauthenticated users
  if (to.meta.requiresAuth && !user.value) {
    return next('/auth/sign-in')
  }

  // Redirect authenticated users away from auth pages
  if (
    to.meta.public &&
    user.value &&
    (to.path === '/auth/sign-up' || to.path === '/auth/sign-in')
  ) {
    return next('/wallets')
  }

  // Check onboarding status for authenticated users on protected routes
  if (user.value && to.meta.requiresAuth) {
    const onboardingFinished = await fetchOnboardingStatus(user.value.id)

    // Redirect to onboarding if not finished (except if already on onboarding)
    if (!onboardingFinished && to.path !== '/onboarding') {
      return next('/onboarding')
    }

    // Redirect away from onboarding if already finished
    if (onboardingFinished && to.path === '/onboarding') {
      return next('/wallets')
    }
  }

  return next()
})
