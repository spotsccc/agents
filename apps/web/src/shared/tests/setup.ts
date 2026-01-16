import { vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { config } from '@vue/test-utils'
import { cleanup } from '@testing-library/vue'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Use automock for supabase (uses __mocks__ folder)
vi.mock('@/shared/supabase')

// Mock useUser composable
vi.mock('@/shared/auth/use-user', () => ({
  useUser: () => ({
    user: ref({ id: 'test-user-id', email: 'test@example.com' }),
    readyPromise: Promise.resolve(),
  }),
}))

// Configure Vue Test Utils to suppress Vue errors/warnings in tests
// Tests should verify error behavior through assertions, not console output
config.global.config.errorHandler = () => {}
config.global.config.warnHandler = () => {}
