import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      browser: {
        provider: playwright(),
        enabled: true,
        instances: [{ browser: 'chromium' }],
        headless: true,
      },
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/shared/tests/setup.ts', 'vitest-browser-vue'],
    },
  }),
)
