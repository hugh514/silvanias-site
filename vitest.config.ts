import path from 'node:path'

import { defineConfig } from 'vitest/config'

// O Vitest não lê os `paths` do tsconfig. Alias definido à mão para evitar mais
// uma dependência só por causa disto.
const alias = { '@': path.resolve(import.meta.dirname, '.') }

/**
 * Duas suites separadas:
 *  - unit        funções puras, sem rede nem base de dados. Rápidas, correm sempre.
 *  - integration falam com um Supabase real. Exigem a salvaguarda de ambiente.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          // A salvaguarda aborta se apontarmos para produção. Ver tests/setup/guarda-ambiente.ts
          setupFiles: ['tests/setup/guarda-ambiente.ts'],
          // Escritas concorrentes na mesma tabela dão falsos negativos.
          fileParallelism: false,
          testTimeout: 30_000,
        },
      },
    ],
  },
})
