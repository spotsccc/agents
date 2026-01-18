<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { z } from 'zod'
import { Input } from '@/shared/components/ui/input'
import { useSignInWithOtp, useVerifyOtp } from '@/shared/auth/use-user'
import { useRouter, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/shared/components/ui/button'

const router = useRouter()

type OtpStep = 'email' | 'otp'

const otpStep = ref<OtpStep>('email')
const submittedEmail = ref('')
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

// Email form
const emailSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
  })
)

const {
  defineField: defineEmailField,
  handleSubmit: handleEmailSubmit,
  errors: emailErrors,
  setFieldError: setEmailError,
} = useForm({
  validationSchema: emailSchema,
  initialValues: { email: '' },
})

const [email] = defineEmailField('email')

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

// Mutations
const signInWithOtpMutation = useSignInWithOtp()
const verifyOtpMutation = useVerifyOtp()

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

const onSendOtp = handleEmailSubmit(async (values) => {
  try {
    await signInWithOtpMutation.mutateAsync({ email: values.email })
    submittedEmail.value = values.email
    otpStep.value = 'otp'
    startResendCountdown()
  } catch {
    setEmailError('email', 'Failed to send code. Please try again.')
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

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<script lang="ts">
export default {
  name: 'SignUpPage',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-semibold">Sign Up</h1>
        <p class="text-muted-foreground mt-2">Create your account with a one-time code</p>
      </div>

      <!-- Step 1: Email -->
      <form v-if="otpStep === 'email'" @submit.prevent="onSendOtp" class="space-y-4">
        <Input
          id="email"
          v-model="email"
          :error="emailErrors.email"
          label="Email"
          placeholder="example@mail.com"
          type="email"
          autocomplete="email"
        />
        <Button type="submit" class="w-full" :disabled="signInWithOtpMutation.isPending.value">
          {{ signInWithOtpMutation.isPending.value ? 'Sending...' : 'Continue' }}
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
        <Button type="submit" class="w-full" :disabled="verifyOtpMutation.isPending.value">
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

      <!-- Navigation to Sign In -->
      <div class="text-center text-sm">
        <span class="text-muted-foreground">Already have an account? </span>
        <RouterLink to="/auth/sign-in" class="text-primary hover:underline"> Sign in </RouterLink>
      </div>
    </div>
  </div>
</template>

<style module></style>
