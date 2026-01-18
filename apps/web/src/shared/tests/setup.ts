import { vi } from 'vitest'
import { ref } from 'vue'
import { config } from '@vue/test-utils'
import '@/app/app.css'

// vitest-browser-vue handles cleanup automatically

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
