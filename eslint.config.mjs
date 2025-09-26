import react from 'eslint-plugin-react';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import betterStyledComponents from 'eslint-plugin-better-styled-components';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Global ignores
  {
    ignores: [
      '.eslintrc.json',
      'package.json',
      'src/data/map/*.json',
      '**/*.geojson',
      '**/*.backUp',
      '.next/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
    ],
  },

  // Base JavaScript/TypeScript configuration
  js.configs.recommended,

  // Legacy configurations using compat
  ...compat.extends(
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@tanstack/query/recommended',
    'next/core-web-vitals',
    'plugin:prettier/recommended'
  ),

  // Main configuration
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],

    plugins: {
      react,
      '@typescript-eslint': typescriptEslint,
      prettier,
      'better-styled-components': betterStyledComponents,
      import: importPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          modules: true,
        },

        project: './tsconfig.json',
      },
    },

    rules: {
      'prettier/prettier': 'error',
      'react/prefer-stateless-function': 0,
      'linebreak-style': 0,
      'jsx-a11y/heading-has-content': 0,
      'jsx-a11y/href-no-hash': 0,
      'jsx-a11y/anchor-is-valid': 0,
      'no-underscore-dangle': 0,
      'react/no-find-dom-node': 0,
      'react/prop-types': 0,

      'react/no-children-prop': [
        'error',
        {
          allowFunctions: true,
        },
      ],

      'no-nested-ternary': 0,
      'react/no-unescaped-entities': 0,

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],

      'no-warning-comments': [
        'error',
        {
          terms: ['FIXME'],
        },
      ],

      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-namespace': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(ignore|_)',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-irregular-whitespace': 'off',
      '@next/next/no-img-element': 'off',

      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-nocheck': true,
        },
      ],

      'import/no-unresolved': 'error',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index', 'unknown'],

          'newlines-between': 'always',
          named: true,

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
