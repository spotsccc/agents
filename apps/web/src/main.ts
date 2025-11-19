import {createApp} from "vue";

import App from "./app/app.vue";
import {router} from "@/app/router";
import {VueQueryPlugin} from '@tanstack/vue-query'
import {supabase} from "@/shared/supabase";

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session && event !== 'INITIAL_SESSION') {
    void router.push('/auth/sign-in');
  }
})

const app = createApp(App);

app.use(router);
app.use(VueQueryPlugin)

app.mount("#app");
