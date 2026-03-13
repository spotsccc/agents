import { render, type ComponentRenderOptions } from 'vitest-browser-vue'
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
  slots?: ComponentRenderOptions<Component, Record<string, unknown>>['slots']
  global?: {
    plugins?: Plugin[]
    stubs?: ComponentRenderOptions<Component, Record<string, unknown>>['global'] extends
      | { stubs?: infer S }
      | undefined
      ? S
      : never
  }
}

export function renderWithPlugins(component: Component, options: RenderWithPluginsOptions = {}) {
  const queryClient = createQueryClient()

  const screen = render(component, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], ...(options.global?.plugins || [])],
      stubs: options.global?.stubs,
    },
  })

  return screen
}

/**
 * Creates a promise that can be resolved manually.
 * Useful for testing loading states.
 */
export function createPendingPromise<T = unknown>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
