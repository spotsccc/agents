import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { RouterLinkStub, createRouterMock } from '@/shared/tests/mocks'
import SignInPage from '../page.vue'

const mockRouter = createRouterMock()

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  RouterLink: RouterLinkStub,
}))

const mockSignInWithOtpMutateAsync = vi.fn()
const mockVerifyOtpMutateAsync = vi.fn()
const mockSignInMutateAsync = vi.fn()

vi.mock('@/shared/auth/use-user', () => ({
  useSignInWithOtp: () => ({
    mutateAsync: mockSignInWithOtpMutateAsync,
    isPending: { value: false },
  }),
  useVerifyOtp: () => ({
    mutateAsync: mockVerifyOtpMutateAsync,
    isPending: { value: false },
  }),
  useSignIn: () => ({
    mutateAsync: mockSignInMutateAsync,
    isPending: { value: false },
  }),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(SignInPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('SignInPage', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    mockSignInWithOtpMutateAsync.mockClear()
    mockVerifyOtpMutateAsync.mockClear()
    mockSignInMutateAsync.mockClear()
    mockSignInWithOtpMutateAsync.mockResolvedValue(undefined)
    mockVerifyOtpMutateAsync.mockResolvedValue({ user: { id: '1' } })
    mockSignInMutateAsync.mockResolvedValue({ user: { id: '1' } })
  })

  describe('OTP Flow', () => {
    it('renders OTP email form by default', async () => {
      const screen = renderPage()

      await expect.element(screen.getByRole('heading', { name: 'Sign In' })).toBeVisible()
      await expect.element(screen.getByText('Sign in with a one-time code')).toBeVisible()
      await expect.element(screen.getByLabelText('Email')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Send Code' })).toBeVisible()
    })

    it('sends OTP and shows verification form', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await vi.waitFor(() => {
        expect(mockSignInWithOtpMutateAsync).toHaveBeenCalledWith({ email: 'test@example.com' })
      })
      await expect.element(screen.getByText(/We sent a code to/)).toBeVisible()
      await expect.element(screen.getByText('test@example.com')).toBeVisible()
      await expect.element(screen.getByLabelText('Verification Code')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Verify' })).toBeVisible()
    })

    it('verifies OTP and navigates to wallets', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await screen.getByLabelText('Verification Code').fill('123456')
      await screen.getByRole('button', { name: 'Verify' }).click()

      await vi.waitFor(() => {
        expect(mockVerifyOtpMutateAsync).toHaveBeenCalledWith({
          email: 'test@example.com',
          token: '123456',
        })
        expect(mockRouter.push).toHaveBeenCalledWith('/wallets')
      })
    })

    it('shows error when OTP verification fails', async () => {
      mockVerifyOtpMutateAsync.mockRejectedValueOnce(new Error('Invalid code'))

      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await screen.getByLabelText('Verification Code').fill('000000')
      await screen.getByRole('button', { name: 'Verify' }).click()

      await expect.element(screen.getByText('Invalid code. Please try again.')).toBeVisible()
    })

    it('allows changing email from verification step', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await screen.getByRole('button', { name: 'Change email' }).click()

      await expect.element(screen.getByLabelText('Email')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Send Code' })).toBeVisible()
    })

    it('shows resend code button after OTP sent', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await expect.element(screen.getByRole('button', { name: /Resend code/ })).toBeVisible()
    })

    it('shows error when sending OTP fails', async () => {
      mockSignInWithOtpMutateAsync.mockRejectedValueOnce(new Error('Failed'))

      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await expect.element(screen.getByText('Failed to send code. Please try again.')).toBeVisible()
    })
  })

  describe('Password Flow', () => {
    it('toggles to password form when link clicked', async () => {
      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()

      await expect.element(screen.getByText('Sign in with your password')).toBeVisible()
      await expect.element(screen.getByLabelText('Email')).toBeVisible()
      await expect.element(screen.getByLabelText('Password')).toBeVisible()
      await expect
        .element(screen.getByRole('button', { name: 'Sign In', exact: true }))
        .toBeVisible()
    })

    it('signs in with password and navigates to wallets', async () => {
      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByLabelText('Password').fill('password123')
      await screen.getByRole('button', { name: 'Sign In', exact: true }).click()

      await vi.waitFor(() => {
        expect(mockSignInMutateAsync).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(mockRouter.push).toHaveBeenCalledWith('/wallets')
      })
    })

    it('shows error when password sign-in fails', async () => {
      mockSignInMutateAsync.mockRejectedValueOnce(new Error('Invalid credentials'))

      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByLabelText('Password').fill('wrongpassword')
      await screen.getByRole('button', { name: 'Sign In', exact: true }).click()

      await expect.element(screen.getByText('Invalid email or password')).toBeVisible()
    })

    it('toggles back to OTP form when link clicked', async () => {
      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()
      await screen.getByRole('button', { name: 'Sign in with one-time code instead' }).click()

      await expect.element(screen.getByText('Sign in with a one-time code')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Send Code' })).toBeVisible()
    })
  })

  describe('Navigation', () => {
    it('renders link to sign up page', async () => {
      const screen = renderPage()

      await expect.element(screen.getByText("Don't have an account?")).toBeVisible()

      const signUpLink = screen.getByRole('link', { name: 'Sign up' })
      await expect.element(signUpLink).toBeVisible()
      await expect.element(signUpLink).toHaveAttribute('href', '/auth/sign-up')
    })
  })

  describe('Validation', () => {
    it('shows validation error for invalid email in OTP form', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('invalid-email')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await expect.element(screen.getByText('Please enter a valid email')).toBeVisible()
    })

    it('shows validation error for invalid email in password form', async () => {
      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()

      await screen.getByLabelText('Email').fill('invalid-email')
      await screen.getByLabelText('Password').fill('password123')
      await screen.getByRole('button', { name: 'Sign In', exact: true }).click()

      await expect.element(screen.getByText('Please enter a valid email')).toBeVisible()
    })

    it('shows validation error for short password', async () => {
      const screen = renderPage()

      await screen.getByRole('button', { name: 'Sign in with password instead' }).click()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByLabelText('Password').fill('123')
      await screen.getByRole('button', { name: 'Sign In', exact: true }).click()

      await expect.element(screen.getByText('Password must be at least 6 characters')).toBeVisible()
    })

    it('shows validation error for invalid OTP code length', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Send Code' }).click()

      await screen.getByLabelText('Verification Code').fill('123')
      await screen.getByRole('button', { name: 'Verify' }).click()

      await expect.element(screen.getByText('Code must be 6 digits')).toBeVisible()
    })
  })
})
