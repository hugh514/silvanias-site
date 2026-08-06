import { type NextRequest } from 'next/server'

import { updateSession } from './lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Apenas as rotas de administração.
     *
     * Antes de 2026-07-25 corria em TODAS as rotas do site. Como o middleware
     * chama `auth.getUser()`, isso significava uma chamada de rede ao serviço de
     * autenticação em cada visita à vitrine — que não usa sessão nenhuma.
     *
     * Restringir a `/admin` fecha a autorização E tira esse peso do caminho
     * crítico do site público, que é onde está o cliente do negócio.
     * Ver SC-009 e o Princípio II da constituição.
     */
    '/admin/:path*',
  ],
}
