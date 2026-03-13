import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'vite-plus'
import { configDefaults } from 'vite-plus/test/config'
import { playwright } from 'vite-plus/test/browser-playwright'

const isCheck = process.argv.includes('check')
const isUiMode = process.argv.includes('--ui')

export default defineConfig({
  ...(isCheck
    ? {}
    : {
        plugins: [
          vue(),
          tailwindcss(),
          svgLoader(),
          process.env.NODE_ENV !== 'production' && vueDevTools(),
        ],
      }),
  server: {
    port: 1234,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ...(isCheck
    ? {}
    : {
        test: {
          browser: {
            provider: playwright(),
            enabled: true,
            instances: [{ browser: 'chromium' }],
            headless: !isUiMode,
          },
          exclude: [...configDefaults.exclude, 'e2e/**'],
          setupFiles: ['./src/shared/tests/setup.ts', 'vitest-browser-vue'],
        },
      }),
  lint: {
    ignorePatterns: ['dist/**'],
    plugins: ['typescript', 'import', 'vue'],
    options: {
      typeCheck: true,
      typeAware: true,
    },
  },
  fmt: {
    ignorePatterns: ['dist/**'],
    semi: false,
    singleQuote: true,
  },
})
