import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/**
 * Cliente com a credencial de SERVIÇO. Faz desvio a todas as políticas de acesso.
 *
 * O `import 'server-only'` na primeira linha é a fronteira (FR-028): se um ficheiro
 * com "use client" importar este módulo, a construção FALHA. Não é convenção nem
 * comentário — é imposto pelo compilador.
 *
 * REGRA DE UTILIZAÇÃO
 * Usar apenas onde a operação exige mesmo desvio às políticas:
 *   - criar utilizadores descartáveis em testes
 *   - chamar as funções de contagem de tentativas de entrada
 *   - recuperar acesso
 *
 * As escritas normais de produto NÃO usam isto. Correm com a sessão da
 * administradora, através de lib/supabase/server.ts, para que as políticas
 * continuem a valer como segunda camada. Recorrer à credencial de serviço para
 * tudo anularia o benefício de as ter — foi precisamente esse o erro que a
 * auditoria de 2026-07-25 encontrou em lib/supabase/server.ts.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) {
    throw new Error(
      'Configuração em falta: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias no servidor.'
    )
  }

  return createSupabaseClient<Database>(url, secret, {
    auth: {
      // Sem sessão, sem cookies, sem renovação: este cliente não representa
      // ninguém. Persistir estado aqui arriscaria contaminar pedidos entre si.
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
