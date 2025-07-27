import "./assets/main.css";

import { createApp } from "vue";

import router from "./app/router";
import App from "./app/app.vue";

const app = createApp(App);

app.use(router);

app.mount("#app");
