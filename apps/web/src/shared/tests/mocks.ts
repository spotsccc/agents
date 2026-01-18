import { vi } from 'vitest'
import { defineComponent, h } from 'vue'

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

export const mockSupabase = {
  from: mockSupabaseFrom,
}

export const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})
