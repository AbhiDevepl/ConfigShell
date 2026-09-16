/**
 * ESLint flat config for the whole monorepo.
 *
 * Deliberately small: the recommended rule sets plus React hook rules, no
 * formatting rules and no style opinions (formatting is not enforced — see
 * CONTRIBUTING.md). Type-aware linting is intentionally not enabled; the
 * `typecheck` scripts (`tsc --noEmit`) already cover type correctness.
 *
 * Run from the repository root:  pnpm lint
 */

import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Build output, dependencies and generated files are never linted.
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', 'apps/web/public/**'],
  },

  // TypeScript sources (apps/web, packages/*).
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Underscore-prefixed identifiers are an accepted "intentionally unused"
      // marker in this codebase.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Test files assert on deliberately untyped payloads — a JSON-RPC result, a
  // tool's heterogeneous return value. Forcing `unknown` plus a cast at every
  // assertion adds noise without catching anything, since the assertion *is*
  // the type check. Narrowed to test files so source keeps the stricter rule.
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // React components and hooks (apps/web only). Only the two classic hook
  // rules are enabled — they catch real bugs and their messages are easy to
  // act on. The plugin's newer React Compiler rules are left off on purpose.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Node JavaScript (apps/server, apps/web/server.js, config files).
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
);
