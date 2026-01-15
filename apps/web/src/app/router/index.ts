import { createRouter, createWebHistory } from 'vue-router'
import { SignUpPage } from '@/pages/auth/sign-up'
import { SignInPage } from '@/pages/auth/sign-in'
import WalletsPage from '@/pages/wallets/wallets-page.vue'
import WalletPage from '@/pages/wallet/wallet-page.vue'
import AuthLayout from '@/shared/layouts/auth/auth-layout.vue'
import CreateTransactionPage from '@/pages/wallet/create-transaction/create-transaction-page.vue'
import { useUser } from '../../shared/auth/use-user.ts'

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
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: '/wallets',
          name: 'wallets',
          component: WalletsPage,
        },
        {
          path: '/wallets/:id',
          name: 'wallet',
          component: WalletPage,
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

router.beforeEach(async (to, _from, next) => {
  const { user, readyPromise } = useUser()
  await readyPromise

  if (to.meta.requiresAuth && !user.value) {
    return next('/auth/sign-in')
  }

  if (
    to.meta.public &&
    user.value &&
    (to.path === '/auth/sign-up' || to.path === '/auth/sign-in')
  ) {
    return next('/wallets')
  }

  return next()
})
