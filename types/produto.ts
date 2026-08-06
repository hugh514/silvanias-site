import type { Database } from './database'

/**
 * Tipos de domínio, derivados do esquema gerado.
 *
 * Vivem aqui e não em `database.ts` porque esse ficheiro é **gerado** — cada
 * `npm run db:types` reescreve-o por completo e levaria estes aliases com ele.
 *
 * Princípio IV: uma fonte de verdade por conceito. Até 2026-07-25 o tipo
 * `Produto` estava redefinido à mão em cinco componentes, cada um livre de
 * divergir do esquema real.
 */

export type Produto = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

/** O que a vitrine precisa de saber sobre um produto. */
export type ProdutoVitrine = Pick<Produto, 'id' | 'nome' | 'categoria' | 'fotos'>

/** O que a listagem do painel precisa. */
export type ProdutoListagem = Pick<
  Produto,
  'id' | 'nome' | 'categoria' | 'disponivel' | 'fotos'
>
