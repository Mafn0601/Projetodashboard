// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      // Regras recomendadas do Next.js (cobre a maioria dos problemas comuns de React/JSX)
      ...nextPlugin.configs.recommended.rules,

      // Opcional: regras mais estritas para performance e boas práticas web
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Regras úteis do TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Outras regras comuns que você pode ativar se quiser mais rigor
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: './tsconfig.json',  // se você tiver tsconfig.json
      },
    },
    ignores: [
    '.next/**',
   'node_modules/**',
   'public/**',
   '**/*.config.js',     // ignora todos os arquivos .config.js
   '**/*.config.mjs',    // ignora .mjs também
   'eslint.config.mjs',  // ignora o próprio config
   ],
  }
);