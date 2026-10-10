import { builtinModules } from 'node:module';
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import noComments from './tools/eslint-rules/no-comments.mjs';
import singleLineImport from './tools/eslint-rules/single-line-import.mjs';
import requireTestId from './tools/eslint-rules/require-test-id.mjs';

const local = { rules: { 'no-comments': noComments, 'single-line-import': singleLineImport, 'require-test-id': requireTestId } };

const nodeGlobals = Object.fromEntries(Object.getOwnPropertyNames(globalThis).map((name) => [name, 'readonly']));

const nodeBuiltins = builtinModules.filter((name) => !name.startsWith('_'));

const dataMessage = 'The renderer must not import shared data.';
const electronMessage = 'The renderer must not import electron.';
const builtinMessage = 'The renderer must not import Node built-ins.';

const restrictedImports = {
  paths: [
    { name: '@shared/data', message: dataMessage },
    { name: '@dreamer-studio/shared/data', message: dataMessage },
    { name: 'electron', message: electronMessage },
    ...nodeBuiltins.map((name) => ({ name, message: builtinMessage })),
  ],
  patterns: [
    { group: ['@shared/data/*', '@dreamer-studio/shared/data/*'], message: dataMessage },
    { group: ['electron/*'], message: electronMessage },
    { group: ['node:*'], message: builtinMessage },
  ],
};

export default defineConfig([
  globalIgnores(['.claude/**', '.playwright-cli/**', '**/dist/**', '**/.angular/**', 'python/.venv/**']),
  {
    files: ['**/*.{ts,mts,cts,js,mjs,cjs}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { local },
    rules: {
      'local/no-comments': 'error',
      'local/single-line-import': 'error',
      'no-duplicate-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-restricted-types': ['error', { types: { Omit: { message: 'Use explicit types instead of Omit.' } } }],
      complexity: ['error', 10],
      'max-lines-per-function': ['error', 40],
    },
  },
  { files: ['tools/**', 'verify/**', 'electron/**', 'eslint.config.js'], languageOptions: { globals: nodeGlobals } },
  { files: ['verify/**'], rules: { 'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }] } },
  {
    files: ['angular/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: { 'no-restricted-imports': ['error', restrictedImports] },
  },
  {
    files: ['angular/**/*.html'],
    extends: [angular.configs.templateRecommended],
    plugins: { local },
    rules: { 'local/no-comments': 'error', 'local/require-test-id': 'error' },
  },
]);
