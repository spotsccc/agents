<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { z } from 'zod'
import { Input } from '@/shared/components/ui/input'
import { useSignIn, useSignInWithOtp, useVerifyOtp } from '@/shared/auth/use-user'
import { useRouter, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/shared/components/ui/button'

const router = useRouter()

type AuthMethod = 'otp' | 'password'
type OtpStep = 'email' | 'otp'

const authMethod = ref<AuthMethod>('otp')
const otpStep = ref<OtpStep>('email')
const submittedEmail = ref('')
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

// OTP email form
const otpEmailSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
  })
)

const {
  defineField: defineOtpEmailField,
  handleSubmit: handleOtpEmailSubmit,
  errors: otpEmailErrors,
  setFieldError: setOtpEmailError,
} = useForm({
  validationSchema: otpEmailSchema,
  initialValues: { email: '' },
})

const [otpEmail] = defineOtpEmailField('email')

// OTP verification form
const otpVerifySchema = toTypedSchema(
  z.object({
    token: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  })
)

const {
  defineField: defineOtpVerifyField,
  handleSubmit: handleOtpVerifySubmit,
  errors: otpVerifyErrors,
  setFieldError: setOtpVerifyError,
  resetForm: resetOtpVerifyForm,
} = useForm({
  validationSchema: otpVerifySchema,
  initialValues: { token: '' },
})

const [otpToken] = defineOtpVerifyField('token')

// Password form
const passwordSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
)

const {
  defineField: definePasswordField,
  handleSubmit: handlePasswordSubmit,
  errors: passwordErrors,
  setFieldError: setPasswordError,
} = useForm({
  validationSchema: passwordSchema,
  initialValues: { email: '', password: '' },
})

const [passwordEmail] = definePasswordField('email')
const [password] = definePasswordField('password')

// Mutations
const signInWithOtpMutation = useSignInWithOtp()
const verifyOtpMutation = useVerifyOtp()
const signInMutation = useSignIn()

const isLoading = computed(
  () =>
    signInWithOtpMutation.isPending.value ||
    verifyOtpMutation.isPending.value ||
    signInMutation.isPending.value
)

function startResendCountdown() {
  resendCountdown.value = 60
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 1000)
}

const onSendOtp = handleOtpEmailSubmit(async (values) => {
  try {
    await signInWithOtpMutation.mutateAsync({ email: values.email })
    submittedEmail.value = values.email
    otpStep.value = 'otp'
    startResendCountdown()
  } catch {
    setOtpEmailError('email', 'Failed to send code. Please try again.')
  }
})

const onVerifyOtp = handleOtpVerifySubmit(async (values) => {
  try {
    await verifyOtpMutation.mutateAsync({
      email: submittedEmail.value,
      token: values.token,
    })
    void router.push('/wallets')
  } catch {
    setOtpVerifyError('token', 'Invalid code. Please try again.')
  }
})

async function onResendCode() {
  if (resendCountdown.value > 0) return
  try {
    await signInWithOtpMutation.mutateAsync({ email: submittedEmail.value })
    startResendCountdown()
    resetOtpVerifyForm()
  } catch {
    setOtpVerifyError('token', 'Failed to resend code. Please try again.')
  }
}

function onChangeEmail() {
  otpStep.value = 'email'
  resetOtpVerifyForm()
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  resendCountdown.value = 0
}

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  try {
    await signInMutation.mutateAsync(values)
    void router.push('/wallets')
  } catch {
    setPasswordError('email', 'Invalid email or password')
  }
})

function toggleAuthMethod() {
  authMethod.value = authMethod.value === 'otp' ? 'password' : 'otp'
}

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<script lang="ts">
export default {
  name: 'SignInPage',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-semibold">Sign In</h1>
        <p class="text-muted-foreground mt-2">
          {{ authMethod === 'otp' ? 'Sign in with a one-time code' : 'Sign in with your password' }}
        </p>
      </div>

      <!-- OTP Flow -->
      <template v-if="authMethod === 'otp'">
        <!-- Step 1: Email -->
        <form v-if="otpStep === 'email'" @submit.prevent="onSendOtp" class="space-y-4">
          <Input
            id="otp-email"
            v-model="otpEmail"
            :error="otpEmailErrors.email"
            label="Email"
            placeholder="example@mail.com"
            type="email"
            autocomplete="email"
          />
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ signInWithOtpMutation.isPending.value ? 'Sending...' : 'Send Code' }}
          </Button>
        </form>

        <!-- Step 2: OTP Verification -->
        <form v-else @submit.prevent="onVerifyOtp" class="space-y-4">
          <p class="text-sm text-muted-foreground">
            We sent a code to <span class="font-medium">{{ submittedEmail }}</span>
          </p>
          <Input
            id="otp-token"
            v-model="otpToken"
            :error="otpVerifyErrors.token"
            label="Verification Code"
            placeholder="000000"
            maxlength="6"
            autocomplete="one-time-code"
          />
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ verifyOtpMutation.isPending.value ? 'Verifying...' : 'Verify' }}
          </Button>
          <div class="flex justify-between text-sm">
            <button type="button" class="text-primary hover:underline" @click="onChangeEmail">
              Change email
            </button>
            <button
              type="button"
              class="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              :disabled="resendCountdown > 0 || signInWithOtpMutation.isPending.value"
              @click="onResendCode"
            >
              {{ resendCountdown > 0 ? `Resend code (${resendCountdown}s)` : 'Resend code' }}
            </button>
          </div>
        </form>
      </template>

      <!-- Password Flow -->
      <form v-else @submit.prevent="onPasswordSubmit" class="space-y-4">
        <Input
          id="password-email"
          v-model="passwordEmail"
          :error="passwordErrors.email"
          label="Email"
          placeholder="example@mail.com"
          type="email"
          autocomplete="email"
        />
        <Input
          id="password"
          v-model="password"
          :error="passwordErrors.password"
          label="Password"
          placeholder="*******"
          type="password"
          autocomplete="current-password"
        />
        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ signInMutation.isPending.value ? 'Signing in...' : 'Sign In' }}
        </Button>
      </form>

      <!-- Toggle Auth Method -->
      <div class="text-center">
        <button
          type="button"
          class="text-sm text-primary hover:underline"
          @click="toggleAuthMethod"
        >
          {{
            authMethod === 'otp'
              ? 'Sign in with password instead'
              : 'Sign in with one-time code instead'
          }}
        </button>
      </div>

      <!-- Navigation to Sign Up -->
      <div class="text-center text-sm">
        <span class="text-muted-foreground">Don't have an account? </span>
        <RouterLink to="/auth/sign-up" class="text-primary hover:underline"> Sign up </RouterLink>
      </div>
    </div>
  </div>
</template>

<style module></style>
