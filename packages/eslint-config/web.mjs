import { globalIgnores } from 'eslint/config'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import eslintConfigPrettier from 'eslint-config-prettier'

export function createWebConfig({ tsconfigRootDir }) {
  return defineConfigWithVueTs(
    {
      name: 'web/files-to-lint',
      files: ['**/*.{ts,mts,tsx,vue}'],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    {
      name: 'web/ui-components',
      files: ['src/shared/components/ui/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      name: 'web/page-components',
      files: ['src/pages/**/page.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      ...pluginVitest.configs.recommended,
      files: ['src/**/__tests__/*'],
    },
    {
      ...pluginPlaywright.configs['flat/recommended'],
      files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    },
    eslintConfigPrettier
  )
}
