import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'
import type { Linter } from 'eslint'

// Double-cast needed: @typescript-eslint/eslint-plugin's Plugin type is
// incompatible with ESLint 9's stricter Plugin interface (known upstream issue).
const config = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'e2e/**', '*.d.ts'],
  },
  // Spread the flat/vue3-recommended array directly
  ...pluginVue.configs['flat/recommended'],
  // Vue SFC overrides
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      'vue/multi-word-component-names': 'off',
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
    },
  },
  // Prettier last to disable conflicting rules
  prettier,
]

export default config as unknown as Linter.Config[]
