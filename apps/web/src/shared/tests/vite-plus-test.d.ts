export {}

interface BrowserElementAssertion {
  not: BrowserElementAssertion
  toBeInTheDocument(): Promise<void>
  toBeVisible(): Promise<void>
  toHaveAttribute(name: string, value?: string | RegExp): Promise<void>
  toHaveTextContent(text: string | RegExp): Promise<void>
  toHaveValue(value: string | number | string[]): Promise<void>
}

declare module 'vite-plus/test' {
  interface ExpectStatic {
    element(element: unknown, options?: unknown): BrowserElementAssertion
  }
}
