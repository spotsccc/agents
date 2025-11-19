import {createRouter, createWebHistory} from "vue-router";
import {InboxPage} from "@/pages/inbox";
import {supabase} from "@/shared/supabase";
import {SignUpPage} from "@/pages/auth/sign-up";
import {SignInPage} from "@/pages/auth/sign-in";
import WalletsPage from "@/pages/wallets/wallets-page.vue";
import WalletPage from "@/pages/wallet/wallet-page.vue";
import AuthLayout from "@/shared/layouts/auth/auth-layout.vue";
import CreateTransactionPage from "@/pages/wallet/create-transaction/create-transaction-page.vue";


export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/auth",
      name: "auth",
      children: [
        {
          path: "/auth/sign-up",
          name: "sign-up",
          component: SignUpPage,
        },
        {
          path: "/auth/sign-in",
          name: "sign-in",
          component: SignInPage,
        },
      ],
      meta: {
        public: true,
      }
    },
    {
      path: "/",
      component: AuthLayout,
      children: [
        {
          path: "/inbox",
          name: "inbox",
          component: InboxPage,
        },
        {
          path: "/wallets",
          name: "wallets",
          component: WalletsPage,
        },
        {
          path: "/wallets/:id",
          name: "wallet",
          component: WalletPage,
        },
        {
          path: "/wallets/:id/transactions/create",
          name: "create-transaction",
          component: CreateTransactionPage,
        },
      ],
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/inbox',
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const {data} = await supabase.auth.getSession()
  const isLoggedIn = !!data.session

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/auth/sign-in');
  }

  if (to.meta.public && isLoggedIn && to.path === '/auth/sign-up') {
    return next('/inbox')
  }

  return next()
})
