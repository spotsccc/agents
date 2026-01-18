import { vi } from 'vitest'
import { defineComponent, h } from 'vue'

// ============================================================================
// Supabase Mocks
// ============================================================================

type SupabaseResponse<T> = Promise<{ data: T | null; error: { message: string } | null }>

const createDefaultInsertResponse = () =>
  Promise.resolve({
    data: { id: 'test-id', name: 'Test Source' },
    error: null,
  })

export const mockSupabaseFrom = vi.fn(() => ({
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(createDefaultInsertResponse) as () => SupabaseResponse<unknown>,
    })),
  })),
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({ data: null, error: null })
      ) as () => SupabaseResponse<unknown>,
    })),
  })),
}))

// ============================================================================
// Supabase Auth Mocks
// ============================================================================

export const mockSignInWithOtp = vi.fn(() => Promise.resolve({ error: null }))

export const mockVerifyOtp = vi.fn(() =>
  Promise.resolve({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'test-token' },
    },
    error: null,
  })
)

export const mockSignInWithPassword = vi.fn(() =>
  Promise.resolve({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'test-token' },
    },
    error: null,
  })
)

export const mockSignUp = vi.fn(() =>
  Promise.resolve({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'test-token' },
    },
    error: null,
  })
)

export const mockSignOut = vi.fn(() => Promise.resolve({ error: null }))

export const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

export const mockSupabaseAuth = {
  signInWithOtp: mockSignInWithOtp,
  verifyOtp: mockVerifyOtp,
  signInWithPassword: mockSignInWithPassword,
  signUp: mockSignUp,
  signOut: mockSignOut,
  onAuthStateChange: mockOnAuthStateChange,
}

export const mockSupabase = {
  from: mockSupabaseFrom,
  auth: mockSupabaseAuth,
}

// ============================================================================
// Supabase Mock Builders
// ============================================================================

interface SupabaseError {
  message: string
}

/**
 * Creates a mock for simple select queries (e.g., supabase.from('table').select())
 */
export function mockSelectQuery<T>(data: T | null, error: SupabaseError | null = null) {
  return {
    select: () => Promise.resolve({ data, error }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Creates a mock for select queries with pending promise (for testing loading states)
 */
export function mockSelectQueryPending<T>(
  promise: Promise<{ data: T | null; error: SupabaseError | null }>
) {
  return {
    select: () => promise,
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Creates a mock for select with eq and single (e.g., supabase.from('table').select().eq().single())
 */
export function mockSelectSingleQuery<T>(data: T | null, error: SupabaseError | null = null) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data, error }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Creates a mock for select with eq and single with pending promise
 */
export function mockSelectSingleQueryPending<T>(
  promise: Promise<{ data: T | null; error: SupabaseError | null }>
) {
  return {
    select: () => ({
      eq: () => ({
        single: () => promise,
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Creates a mock for insert queries
 */
export function mockInsertQuery<T>(data: T | null, error: SupabaseError | null = null) {
  return {
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data, error }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Creates a mock for ordered queries with limit
 */
export function mockOrderedQuery<T>(data: T | null, error: SupabaseError | null = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

/**
 * Helper to setup mockSupabaseFrom with table-specific responses
 */
export function setupSupabaseMock(
  tableResponses: Record<string, ReturnType<typeof mockSupabaseFrom>>
) {
  mockSupabaseFrom.mockImplementation(((table: string) => {
    return tableResponses[table] ?? tableResponses['default'] ?? mockSupabaseFrom()
  }) as typeof mockSupabaseFrom)
}

// ============================================================================
// Router Mocks
// ============================================================================

/**
 * Stub for RouterLink component.
 * Renders as an <a> tag with href containing the route.
 * Supports both string and object routes.
 */
export const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  setup(props, { slots }) {
    const href = typeof props.to === 'object' ? JSON.stringify(props.to) : String(props.to)
    return () => h('a', { href }, slots.default?.())
  },
})

/**
 * Creates a mock for useRouter
 */
export function createRouterMock() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }
}

/**
 * Creates a mock for useRoute
 */
export function createRouteMock(
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  return {
    params,
    query,
  }
}
