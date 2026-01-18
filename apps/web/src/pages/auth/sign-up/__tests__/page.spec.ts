import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { RouterLinkStub, createRouterMock } from '@/shared/tests/mocks'
import SignUpPage from '../page.vue'

const mockRouter = createRouterMock()

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  RouterLink: RouterLinkStub,
}))

const mockSignInWithOtpMutateAsync = vi.fn()
const mockVerifyOtpMutateAsync = vi.fn()

vi.mock('@/shared/auth/use-user', () => ({
  useSignInWithOtp: () => ({
    mutateAsync: mockSignInWithOtpMutateAsync,
    isPending: { value: false },
  }),
  useVerifyOtp: () => ({
    mutateAsync: mockVerifyOtpMutateAsync,
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

  return render(SignUpPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('SignUpPage', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    mockSignInWithOtpMutateAsync.mockClear()
    mockVerifyOtpMutateAsync.mockClear()
    mockSignInWithOtpMutateAsync.mockResolvedValue(undefined)
    mockVerifyOtpMutateAsync.mockResolvedValue({ user: { id: '1' } })
  })

  describe('Email Step', () => {
    it('renders email form by default', async () => {
      const screen = renderPage()

      await expect.element(screen.getByRole('heading', { name: 'Sign Up' })).toBeVisible()
      await expect
        .element(screen.getByText('Create your account with a one-time code'))
        .toBeVisible()
      await expect.element(screen.getByLabelText('Email')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
    })

    it('sends OTP and shows verification form', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await vi.waitFor(() => {
        expect(mockSignInWithOtpMutateAsync).toHaveBeenCalledWith({ email: 'test@example.com' })
      })
      await expect.element(screen.getByText(/We sent a code to/)).toBeVisible()
      await expect.element(screen.getByText('test@example.com')).toBeVisible()
      await expect.element(screen.getByLabelText('Verification Code')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Verify' })).toBeVisible()
    })

    it('shows error when sending OTP fails', async () => {
      mockSignInWithOtpMutateAsync.mockRejectedValueOnce(new Error('Failed'))

      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await expect.element(screen.getByText('Failed to send code. Please try again.')).toBeVisible()
    })

    it('shows validation error for invalid email', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('invalid-email')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await expect.element(screen.getByText('Please enter a valid email')).toBeVisible()
    })
  })

  describe('OTP Verification Step', () => {
    it('verifies OTP and navigates to wallets', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

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
      await screen.getByRole('button', { name: 'Continue' }).click()

      await screen.getByLabelText('Verification Code').fill('000000')
      await screen.getByRole('button', { name: 'Verify' }).click()

      await expect.element(screen.getByText('Invalid code. Please try again.')).toBeVisible()
    })

    it('allows changing email from verification step', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await screen.getByRole('button', { name: 'Change email' }).click()

      await expect.element(screen.getByLabelText('Email')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
    })

    it('shows resend code button after OTP sent', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await expect.element(screen.getByRole('button', { name: /Resend code/ })).toBeVisible()
    })

    it('shows validation error for invalid OTP code length', async () => {
      const screen = renderPage()

      await screen.getByLabelText('Email').fill('test@example.com')
      await screen.getByRole('button', { name: 'Continue' }).click()

      await screen.getByLabelText('Verification Code').fill('123')
      await screen.getByRole('button', { name: 'Verify' }).click()

      await expect.element(screen.getByText('Code must be 6 digits')).toBeVisible()
    })
  })

  describe('Navigation', () => {
    it('renders link to sign in page', async () => {
      const screen = renderPage()

      await expect.element(screen.getByText('Already have an account?')).toBeVisible()

      const signInLink = screen.getByRole('link', { name: 'Sign in' })
      await expect.element(signInLink).toBeVisible()
      await expect.element(signInLink).toHaveAttribute('href', '/auth/sign-in')
    })
  })
})
