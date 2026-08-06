import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'

/**
 * Cliente de servidor com a chave PUBLICÁVEL e os cookies do pedido.
 *
 * Antes de 2026-07-25 este ficheiro usava SUPABASE_SECRET_KEY, o que significava
 * que TODAS as páginas de servidor corriam com desvio às políticas de acesso —
 * incluindo a página pública de produto. As políticas existiam mas nunca se
 * aplicavam do lado do servidor.
 *
 * Com a chave publicável e a sessão do utilizador, o RLS volta a ser rede de
 * segurança: uma página que se esqueça de filtrar `disponivel` deixa de vazar
 * produtos escondidos, porque a base de dados a impede.
 *
 * Para operações que exijam mesmo privilégio, ver lib/supabase/admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishable) {
    throw new Error(
      'Configuração em falta: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórias.'
    )
  }

  return createServerClient<Database>(url, publishable, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Chamado a partir de um Server Component, onde escrever cookies não é
          // permitido. O middleware trata da renovação da sessão.
        }
      },
    },
  })
}

/**
 * Verifica se o utilizador do pedido atual consta da lista de administradores.
 *
 * Chama a função `is_admin()` da base de dados em vez de reimplementar a regra
 * em TypeScript: assim existe uma única definição de "quem é administrador",
 * partilhada pelas políticas de acesso e pela aplicação. Duas definições
 * acabariam por divergir, e a divergência seria uma brecha.
 */
export async function verificarAdmin(): Promise<
  | { autorizado: true; userId: string }
  | { autorizado: false; motivo: 'sem-sessao' | 'nao-admin' }
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { autorizado: false, motivo: 'sem-sessao' }

  const { data, error } = await supabase.rpc('is_admin')

  if (error || data !== true) return { autorizado: false, motivo: 'nao-admin' }

  return { autorizado: true, userId: user.id }
}
