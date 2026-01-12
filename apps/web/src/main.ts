import { createApp } from "vue";

import App from "./app/app.vue";
import { router } from "@/app/router";
import { VueQueryPlugin } from "@tanstack/vue-query";

const app = createApp(App);

app.use(router);
app.use(VueQueryPlugin);

app.mount("#app");
