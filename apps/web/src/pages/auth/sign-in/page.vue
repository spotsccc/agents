<script setup lang="ts">
import {supabase} from "@/shared/supabase";
import {ref} from "vue";
import {z} from "zod";
import {Ui as VStack} from "@/shared/ui/stack";
import TextInput from "@/shared/ui/text-input/ui.vue";
import VButton from "@/shared/ui/button/ui.vue";

const password = ref('');
const passwordError = ref('');
const email = ref('');
const emailError = ref('');

const rules = {
  password: z.string()
    .min(6, 'Password must be at least 8 characters'),
  email: z.email(),
}

async function signIn() {

    const passwordRes = rules.password.safeParse(password.value);
    if (passwordRes.error) {
      passwordError.value = passwordRes.error.issues[0].message;
      return;
    }
    const emailRes = rules.email.safeParse(email.value);
    if (emailRes.error) {
      emailError.value = emailRes.error.issues[0].message;
      return;
    }

    const result = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (result.error) {
      switch (result.error.code) {
        case "invalid_credentials":
          emailError.value = 'Invalid email or password';
          return;
        default:
          emailError.value = 'Unknown error';
          return;
      }
    }

}
</script>

<script lang="ts">
export default {
  name: "SignInPage",
};
</script>

<template>
  <VStack w="100dvw" h="100dvh" justify="center" align="center">
    <VStack is="form" @submit.prevent="signIn" :w="500">
      <TextInput :error="emailError" label="Email" placeholder="email@example.com" v-model="email"/>
      <TextInput label="Password" placeholder="password" type="password" v-model="password"/>
      <VButton type="submit">
        Sign in
      </VButton>
    </VStack>
  </VStack>
</template>

<style module>
.root {

}
</style>
