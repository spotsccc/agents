<script setup lang="ts">
import { useSignUp } from '@/shared/auth/use-user.ts'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useRouter } from 'vue-router'

const router = useRouter()

const scheme = toTypedSchema(
  z.object({
    password: z.string().min(6, 'Password must be at least 8 characters'),
    email: z.email(),
  })
)

const { defineField, handleSubmit, errors, setFieldError } = useForm({
  validationSchema: scheme,
  initialValues: {
    email: '',
    password: '',
  },
})

const signUpMutation = useSignUp()

const onSubmit = handleSubmit(async (values) => {
  try {
    await signUpMutation.mutateAsync(values)
    void router.push('/wallets')
  } catch (error) {
    setFieldError('email', 'Invalid email or password')
  }
})

const [email] = defineField('email')
const [password] = defineField('password')
</script>

<script lang="ts">
export default {
  name: 'SignUpPage',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center" style="width: 100dvw; height: 100dvh">
    <p>Sign up</p>
    <form @submit.prevent="onSubmit" style="width: 500px" class="flex flex-col">
      <Input
        id="email"
        v-model="email"
        :error="errors.email"
        label="Email"
        placeholder="example@mail.com"
      />
      <Input
        id="password"
        type="password"
        v-model="password"
        :error="errors.password"
        label="Password"
        placeholder="*******"
      />
      <Button type="submit"> Submit </Button>
    </form>
  </div>
</template>
