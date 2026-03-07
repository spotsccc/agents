import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export function createSupabaseConfig() {
  return tseslint.config(
    {
      name: 'supabase/files-to-lint',
      files: ['functions/**/*.ts', 'scheme/**/*.ts'],
      languageOptions: {
        globals: {
          ...globals.serviceworker,
          Deno: 'readonly',
        },
      },
    },
    globalIgnores([
      '**/.temp/**',
      '**/.turbo/**',
      '**/node_modules/**',
      'migrations/**',
    ]),
    ...tseslint.configs.recommended,
    eslintConfigPrettier
  )
}
