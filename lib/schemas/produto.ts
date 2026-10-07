import { z } from 'zod'

import { CATEGORIAS } from '@/lib/constants'

/**
 * Esquema único do produto, partilhado entre cliente e servidor.
 *
 * O cliente valida por cortesia de experiência — evita uma ida ao servidor para
 * dizer que o nome está vazio. O servidor revalida SEMPRE (Princípio III): a
 * validação do cliente é conveniência, nunca controlo de segurança. Quem chame a
 * ação diretamente nunca passa pelo formulário.
 */

export const MAX_FOTOS = 4

export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome do produto.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),

  categoria: z.enum(CATEGORIAS, {
    message: 'Selecione uma categoria válida.',
  }),

  descricao: z
    .string()
    .trim()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres.')
    // Campo vazio é guardado como nulo, não como string vazia: evita ter dois
    // valores diferentes a significar "sem descrição".
    .transform((v) => v || null)
    .nullable(),

  ingredientes: z
    .string()
    .trim()
    .max(1000, 'Os ingredientes devem ter no máximo 1000 caracteres.')
    .transform((v) => v || null)
    .nullable(),

  disponivel: z.boolean(),

  /** Posição no catálogo público: menor aparece primeiro. */
  ordem: z
    .number({ message: 'A ordem deve ser um número inteiro.' })
    .int('A ordem deve ser um número inteiro.')
    .min(-9999, 'A ordem deve estar entre -9999 e 9999.')
    .max(9999, 'A ordem deve estar entre -9999 e 9999.')
    .default(0),

  destaque: z.boolean().default(false),

  /** Endereços de fotos já guardadas que devem ser mantidas. */
  fotosExistentes: z
    // URL do armazenamento, ou uma das imagens estáticas do site (`/images/…`).
    .array(z.union([z.string().url(), z.string().regex(/^\/images\/[\w.-]+$/)]))
    .max(MAX_FOTOS, `São permitidas no máximo ${MAX_FOTOS} fotos.`)
    .default([]),
})

export type ProdutoInput = z.input<typeof produtoSchema>
export type ProdutoValidado = z.output<typeof produtoSchema>

/** Erros por campo, na forma que as ações devolvem ao formulário. */
export type CamposComErro = Partial<Record<keyof ProdutoValidado, string>>

/**
 * Converte os dados de um formulário no objeto validado.
 * Usada pelo servidor; o cliente pode usar o mesmo esquema diretamente.
 */
export function validarFormularioProduto(
  formData: FormData
): { ok: true; dados: ProdutoValidado } | { ok: false; camposComErro: CamposComErro } {
  const bruto = {
    nome: String(formData.get('nome') ?? ''),
    categoria: String(formData.get('categoria') ?? ''),
    descricao: String(formData.get('descricao') ?? ''),
    ingredientes: String(formData.get('ingredientes') ?? ''),
    disponivel: formData.get('disponivel') === 'sim',
    ordem: Number(String(formData.get('ordem') ?? '').trim() || '0'),
    destaque: formData.get('destaque') === 'sim',
    fotosExistentes: formData.getAll('fotosExistentes').map(String),
  }

  const resultado = produtoSchema.safeParse(bruto)

  if (resultado.success) return { ok: true, dados: resultado.data }

  const camposComErro: CamposComErro = {}
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as keyof ProdutoValidado | undefined
    if (campo && !camposComErro[campo]) camposComErro[campo] = problema.message
  }

  return { ok: false, camposComErro }
}
