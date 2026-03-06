import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import pluginVitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    name: 'bot/files-to-lint',
    files: ['**/*.ts'],
  },
  globalIgnores(['**/dist/**', '**/coverage/**', '**/node_modules/**']),

  ...tseslint.configs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['__tests__/**/*.ts'],
  },

  eslintConfigPrettier,
)
