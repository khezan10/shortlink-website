import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

/**
 * Flat ESLint config.
 *
 * The plugin set is deliberately small: eslint-config-next pulls in
 * fast-glob -> micromatch -> braces, and the current braces advisory
 * (<= 3.0.3, no patched release yet) makes `npm audit` report five high
 * severity issues for what is only a lint-time glob parser. These plugins
 * cover the same ground without that dependency chain.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      // eslint-plugin-jsx-a11y ships no flat config; the rule set is the same.
      ...jsxA11y.configs.recommended.rules,

      // Next.js App Router: hooks do not need a React import.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: ['tests/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
)
