import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const SECRET = process.env.SUPABASE_SECRET_KEY!

export type ClienteSupabase = SupabaseClient<Database>

/** Cliente com a credencial de serviço. Faz desvio a todas as políticas. */
export function clienteServico(): ClienteSupabase {
  return createClient<Database>(URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Cliente anónimo — o que qualquer visitante consegue construir a partir do site. */
export function clienteAnonimo(): ClienteSupabase {
  return createClient<Database>(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type UtilizadorDescartavel = {
  id: string
  email: string
  /** Cliente autenticado como este utilizador, usando a chave ANÓNIMA —
   *  exatamente o que um atacante teria. */
  cliente: ClienteSupabase
  /** Remove o utilizador. Chamar sempre em `finally`. */
  apagar: () => Promise<void>
}

let contador = 0

/**
 * Cria e autentica um utilizador descartável.
 *
 * Reproduz o que a auditoria de 2026-07-25 fez à mão: criar conta, autenticar, e
 * verificar o que essa conta consegue fazer. A diferença é que agora corre
 * automaticamente a cada alteração.
 *
 * `email_confirm: true` evita o envio de correio — a conta nasce já confirmada.
 */
export async function criarUtilizadorDescartavel(): Promise<UtilizadorDescartavel> {
  const servico = clienteServico()
  const email = `descartavel.${Date.now()}.${contador++}@exemplo-teste.invalid`
  const senha = `Descartavel-${crypto.randomUUID()}!`

  const { data: criado, error: erroCriacao } = await servico.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (erroCriacao || !criado.user) {
    throw new Error(`Não foi possível criar o utilizador descartável: ${erroCriacao?.message}`)
  }

  const cliente = clienteAnonimo()
  const { error: erroLogin } = await cliente.auth.signInWithPassword({ email, password: senha })

  if (erroLogin) {
    await servico.auth.admin.deleteUser(criado.user.id)
    throw new Error(`Não foi possível autenticar o utilizador descartável: ${erroLogin.message}`)
  }

  return {
    id: criado.user.id,
    email,
    cliente,
    apagar: async () => {
      await servico.from('admins').delete().eq('user_id', criado.user!.id)
      await servico.auth.admin.deleteUser(criado.user!.id)
    },
  }
}

/** Promove a administrador. Usa a credencial de serviço — `admins` não é escrivível de fora. */
export async function promoverAAdmin(userId: string): Promise<void> {
  const { error } = await clienteServico()
    .from('admins')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
  if (error) throw new Error(`Falha ao promover: ${error.message}`)
}

/** Remove da lista de administradores. */
export async function despromover(userId: string): Promise<void> {
  const { error } = await clienteServico().from('admins').delete().eq('user_id', userId)
  if (error) throw new Error(`Falha ao despromover: ${error.message}`)
}

/** Cria um produto pela credencial de serviço, para servir de alvo aos testes. */
export async function criarProdutoDeTeste(
  disponivel: boolean
): Promise<{ id: string; apagar: () => Promise<void> }> {
  const servico = clienteServico()
  const { data, error } = await servico
    .from('produtos')
    .insert({
      nome: `Produto de teste ${crypto.randomUUID().slice(0, 8)}`,
      categoria: 'Chocolate',
      disponivel,
      fotos: [],
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Falha ao criar produto de teste: ${error?.message}`)

  return {
    id: data.id,
    apagar: async () => {
      await servico.from('produtos').delete().eq('id', data.id)
    },
  }
}

/** Bytes de um PNG mínimo válido, para testes de envio. */
export function pngMinimo(): Uint8Array {
  const buf = new Uint8Array(128)
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  return buf
}
