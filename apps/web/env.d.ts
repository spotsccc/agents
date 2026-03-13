/// <reference types="vite-plus/client" />
/// <reference types="vite-plus/test/browser" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}
