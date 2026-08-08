import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/database'

/**
 * Encaminhamento das rotas de administração.
 *
 * Antes de 2026-07-25 este ficheiro verificava apenas `!user` — ter sessão
 * bastava para entrar no painel. Combinado com o registo público aberto, isso
 * significava que qualquer pessoa criava conta e entrava.
 *
 * IMPORTANTE: isto é conveniência de encaminhamento, NÃO a fronteira de
 * segurança. As fronteiras reais são as políticas de acesso da base de dados e a
 * verificação dentro de cada ação de servidor. Um middleware contornado não deve
 * dar poder de escrita a ninguém — e, depois desta feature, não dá.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const caminho = request.nextUrl.pathname
  const rotaLogin = caminho === '/admin/login'

  function redirecionar(destino: string) {
    const url = request.nextUrl.clone()
    url.pathname = destino
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Sem sessão a tentar entrar no painel → página de entrada.
  if (!rotaLogin && !user) return redirecionar('/admin/login')

  if (user) {
    // Consulta por pedido em vez de reivindicação embutida no token.
    // Decisão D3: a reivindicação vive até o token renovar (por omissão uma
    // hora), e durante esse tempo um administrador removido continuaria a
    // entrar. FR-005 exige efeito no pedido seguinte. Num painel de uso
    // ocasional o custo desta consulta é irrelevante.
    const { data: ehAdmin } = await supabase.rpc('is_admin')

    // Autenticado mas fora da lista → página de entrada, não página de erro.
    // Não confirmar a existência do painel a quem não tem nada que ver com ele,
    // pela mesma lógica que impede enumerar contas (FR-021).
    if (ehAdmin !== true) {
      if (rotaLogin) return supabaseResponse
      return redirecionar('/admin/login')
    }

    // Administrador já autenticado na página de entrada → painel.
    if (rotaLogin) return redirecionar('/admin/produtos')
  }

  return supabaseResponse
}
