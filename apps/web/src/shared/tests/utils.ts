import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import type { Component, Plugin } from 'vue'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface RenderWithPluginsOptions {
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  global?: {
    plugins?: Plugin[]
    stubs?: Record<string, unknown>
  }
}

export function renderWithPlugins(component: Component, options: RenderWithPluginsOptions = {}) {
  const queryClient = createQueryClient()
  const user = userEvent.setup()

  const renderResult = render(component, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], ...(options.global?.plugins || [])],
      stubs: {
        // Stub Teleport to render content inline (needed for Reka UI Select/Dropdown tests)
        teleport: true,
        ...options.global?.stubs,
      },
    },
  })

  return {
    ...renderResult,
    user,
  }
}
