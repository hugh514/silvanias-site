import 'server-only'

import { cache } from 'react'

import {
  CHAVES_CONTEUDO,
  CONTEUDO_PADRAO,
  validarConteudo,
  type ConteudoSite,
} from '@/lib/schemas/conteudo-site'
import { createClient } from '@/lib/supabase/server'

/**
 * Lê todas as secções numa consulta (memorizada por pedido). Linha em falta,
 * inválida ou erro de rede → texto padrão: a vitrine nunca fica vazia.
 */
export const carregarConteudo = cache(async (): Promise<ConteudoSite> => {
  const conteudo: ConteudoSite = { ...CONTEUDO_PADRAO }

  const supabase = await createClient()
  const { data, error } = await supabase.from('conteudo_site').select('chave, conteudo')
  if (error) {
    console.error('[carregarConteudo]', error)
    return conteudo
  }

  for (const chave of CHAVES_CONTEUDO) {
    const linha = data.find((l) => l.chave === chave)
    if (!linha) continue
    const r = validarConteudo(chave, linha.conteudo)
    if (r.ok) Object.assign(conteudo, { [chave]: r.dados })
  }

  return conteudo
})
