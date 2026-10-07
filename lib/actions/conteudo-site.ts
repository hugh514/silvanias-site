'use server'

import { revalidatePath } from 'next/cache'

import {
  CHAVES_CONTEUDO,
  validarConteudo,
  type CamposComErroConteudo,
  type ChaveConteudo,
} from '@/lib/schemas/conteudo-site'
import { createClient, verificarAdmin } from '@/lib/supabase/server'

export type ResultadoConteudo =
  | { ok: true }
  | { ok: false; erro: string; camposComErro?: CamposComErroConteudo; enviado?: Record<string, string> }

const ERRO_GENERICO = 'Não foi possível salvar. Tente novamente.'

/** Campos numéricos chegam do formulário como texto. */
const CAMPOS_NUMERICOS = new Set(['lat', 'lng'])

function lerFormulario(formData: FormData): Record<string, unknown> {
  const bruto: Record<string, unknown> = {}
  for (const [campo, valor] of formData.entries()) {
    if (typeof valor !== 'string' || campo.startsWith('$')) continue
    bruto[campo] = CAMPOS_NUMERICOS.has(campo) ? Number(valor.replace(',', '.')) : valor
  }
  return bruto
}

/**
 * Grava uma secção do conteúdo da vitrine.
 * Mesma ordem das ações de produto: sessão → autorização → validação → escrita.
 * O RLS também barra quem não é admin; as duas camadas são independentes.
 */
export async function guardarConteudo(
  chave: ChaveConteudo,
  _estadoAnterior: ResultadoConteudo | null,
  formData: FormData
): Promise<ResultadoConteudo> {
  const auth = await verificarAdmin()
  if (!auth.autorizado) {
    return {
      ok: false,
      erro:
        auth.motivo === 'sem-sessao'
          ? 'Sua sessão expirou. Entre novamente para continuar.'
          : 'Você não tem permissão para alterar o site.',
    }
  }

  if (!CHAVES_CONTEUDO.includes(chave)) return { ok: false, erro: ERRO_GENERICO }

  const validacao = validarConteudo(chave, lerFormulario(formData))
  if (!validacao.ok) {
    // Devolve o que foi digitado: o React limpa o formulário após a ação e a
    // pessoa perderia o texto que precisa de corrigir.
    const enviado = Object.fromEntries(
      [...formData.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$'))
    ) as Record<string, string>
    return { ok: false, erro: 'Verifique os campos destacados.', camposComErro: validacao.camposComErro, enviado }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conteudo_site')
    .update({ conteudo: validacao.dados })
    .eq('chave', chave)
    .select('chave')

  // Zero linhas sem erro = o RLS filtrou a escrita. Tratar como falha, não sucesso.
  if (error || !data?.length) {
    if (error) console.error('[guardarConteudo]', error)
    return { ok: false, erro: ERRO_GENERICO }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
