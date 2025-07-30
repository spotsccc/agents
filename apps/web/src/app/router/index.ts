import { createRouter, createWebHistory } from "vue-router";
import { SignInPage } from "@/pages/auth/sign-in";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/auth/sign-in",
      name: "sign-in",
      component: SignInPage,
    },
  ],
});
