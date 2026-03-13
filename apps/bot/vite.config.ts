import { defineConfig } from 'vite-plus'

export default defineConfig({
  appType: 'custom',
  publicDir: false,
  build: {
    emptyOutDir: true,
    minify: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'index.mjs',
      },
    },
    sourcemap: true,
    ssr: 'src/index.ts',
    target: 'es2023',
  },
  fmt: {
    ignorePatterns: ['dist/**'],
    semi: false,
    singleQuote: true,
  },
  lint: {
    options: {
      tsconfig: './tsconfig.json',
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    environment: 'node',
    include: ['__tests__/**/*.spec.ts'],
  },
})
