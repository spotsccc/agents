<script setup lang="ts">
import {z} from "zod";
import {VStack} from "@/shared/ui/stack";
import {VText} from "@/shared/ui/text";
import {Input} from "@/shared/components/ui/input";
import {useSignIn} from "@/shared/auth/use-user";
import {useRouter} from "vue-router";
import {useForm} from "vee-validate";
import {toTypedSchema} from '@vee-validate/zod'
import {Button} from "@/shared/components/ui/button";

const router = useRouter();

const scheme = toTypedSchema(z.object({
  password: z.string().min(6, "Password must be at least 8 characters"),
  email: z.email(),
}));

const {defineField, handleSubmit, errors, setFieldError} = useForm({
  validationSchema: scheme,
  initialValues: {
    email: '',
    password: '',
  },
})


const signInMutation = useSignIn()

const onSubmit = handleSubmit(async (values) => {
  try {
    await signInMutation.mutateAsync(values);
    void router.push('/inbox');
  } catch (error) {
    setFieldError('email', 'Invalid email or password')
  }
})

const [email] = defineField('email');
const [password] = defineField('password');

</script>

<script lang="ts">
export default {
  name: "SignInPage",
};
</script>

<template>
  <VStack w="100dvw" h="100dvh" justify="center" align="center">
    <VText> Sign in with email and password</VText>
    <VStack is="form" @submit.prevent="onSubmit" :w="500">
      <Input id="email" v-model="email" :error="errors.email" label="Email"
             placeholder="example@mail.com"/>
      <Input id="password" type="password" v-model="password" :error="errors.password"
             label="Password" placeholder="*******"/>
      <Button type="submit">
        Submit
      </Button>
    </VStack>
  </VStack>
</template>

<style module>
</style>
