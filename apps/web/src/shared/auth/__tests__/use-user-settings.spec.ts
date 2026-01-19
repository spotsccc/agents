import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import { defineComponent, h } from 'vue'
import { useUserSettings, useCompleteOnboarding } from '../use-user-settings'

const mockUser = { id: 'user-123', email: 'test@example.com' }

vi.mock('@/shared/auth/use-user.ts', () => ({
  useUser: () => ({ user: { value: mockUser } }),
}))

function mockUserSettingsQuery(onboardingFinished: boolean) {
  mockSupabaseFrom.mockReturnValueOnce({
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: { onboarding_finished: onboardingFinished, user_id: mockUser.id },
            error: null,
          }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

function mockUserSettingsNotFound() {
  mockSupabaseFrom.mockReturnValueOnce({
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'The result contains 0 rows' },
          }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

function mockUpdateSuccess() {
  mockSupabaseFrom.mockReturnValueOnce({
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

function mockUpdateError(message: string) {
  mockSupabaseFrom.mockReturnValueOnce({
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: { message } }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

const TestUserSettings = defineComponent({
  setup() {
    const { settings, isLoading, isError, onboardingFinished } = useUserSettings()
    return () =>
      h('div', [
        h('span', { 'data-testid': 'loading' }, isLoading.value ? 'loading' : 'loaded'),
        h('span', { 'data-testid': 'error' }, isError.value ? 'error' : 'no-error'),
        h(
          'span',
          { 'data-testid': 'onboarding' },
          onboardingFinished.value ? 'finished' : 'not-finished'
        ),
        h('span', { 'data-testid': 'settings' }, JSON.stringify(settings.value)),
      ])
  },
})

const TestCompleteOnboarding = defineComponent({
  setup() {
    const mutation = useCompleteOnboarding()
    return () =>
      h('div', [
        h('span', { 'data-testid': 'pending' }, mutation.isPending.value ? 'pending' : 'idle'),
        h('span', { 'data-testid': 'error' }, mutation.isError.value ? 'error' : 'no-error'),
        h(
          'button',
          { 'data-testid': 'complete-btn', onClick: () => mutation.mutate() },
          'Complete'
        ),
      ])
  },
})

describe('useUserSettings', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('fetches user settings from correct table', async () => {
    mockUserSettingsQuery(false)
    renderWithPlugins(TestUserSettings)

    await vi.waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('user_settings')
    })
  })

  it('returns onboardingFinished as false when not completed', async () => {
    mockUserSettingsQuery(false)
    const screen = renderWithPlugins(TestUserSettings)

    await expect.element(screen.getByTestId('onboarding')).toHaveTextContent('not-finished')
  })

  it('returns onboardingFinished as true when completed', async () => {
    mockUserSettingsQuery(true)
    const screen = renderWithPlugins(TestUserSettings)

    await expect.element(screen.getByTestId('onboarding')).toHaveTextContent('finished')
  })

  it('returns onboardingFinished as false when settings not found (PGRST116)', async () => {
    mockUserSettingsNotFound()
    const screen = renderWithPlugins(TestUserSettings)

    await expect.element(screen.getByTestId('onboarding')).toHaveTextContent('not-finished')
    await expect.element(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('returns settings data when loaded', async () => {
    mockUserSettingsQuery(true)
    const screen = renderWithPlugins(TestUserSettings)

    await vi.waitFor(async () => {
      const settingsText = await screen.getByTestId('settings').element()
      expect(settingsText.textContent).toContain('onboarding_finished')
    })
  })
})

describe('useCompleteOnboarding', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('updates user_settings table with onboarding_finished = true', async () => {
    mockUpdateSuccess()
    const screen = renderWithPlugins(TestCompleteOnboarding)

    await screen.getByTestId('complete-btn').click()

    await vi.waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('user_settings')
    })
  })

  it('shows pending state during mutation', async () => {
    let resolvePromise: () => void
    const pendingPromise = new Promise<{ data: null; error: null }>((resolve) => {
      resolvePromise = () => resolve({ data: null, error: null })
    })

    mockSupabaseFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => pendingPromise,
      }),
    } as unknown as ReturnType<typeof mockSupabaseFrom>)

    const screen = renderWithPlugins(TestCompleteOnboarding)

    await screen.getByTestId('complete-btn').click()

    await expect.element(screen.getByTestId('pending')).toHaveTextContent('pending')

    resolvePromise!()
  })

  it('shows error state when mutation fails', async () => {
    mockUpdateError('Database error')
    const screen = renderWithPlugins(TestCompleteOnboarding)

    await screen.getByTestId('complete-btn').click()

    await expect.element(screen.getByTestId('error')).toHaveTextContent('error')
  })

  it('returns to idle state after successful mutation', async () => {
    mockUpdateSuccess()
    const screen = renderWithPlugins(TestCompleteOnboarding)

    await screen.getByTestId('complete-btn').click()

    await vi.waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalled()
    })

    await expect.element(screen.getByTestId('pending')).toHaveTextContent('idle')
  })
})
