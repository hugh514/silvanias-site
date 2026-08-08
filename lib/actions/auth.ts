'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type ResultadoEntrada = { ok: false; erro: string } | { ok: true }

/**
 * Mensagem ÚNICA para qualquer falha de entrada.
 *
 * FR-021: tem de ser idêntica para endereço inexistente, palavra-passe errada, e
 * conta válida que não consta da lista de administradores. Qualquer diferença
 * permite enumerar as contas registadas.
 */
const ERRO_CREDENCIAIS = 'Email ou senha inválidos.'

/**
 * Origem do pedido, para a contagem de tentativas.
 *
 * Atrás de um proxy, o endereço real vem em `x-forwarded-for`. O primeiro valor
 * da lista é o cliente; os seguintes são os proxies pelo caminho.
 */
async function origemDoPedido(): Promise<string> {
  const h = await headers()
  const encaminhado = h.get('x-forwarded-for')
  if (encaminhado) return encaminhado.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? 'desconhecida'
}

export async function entrar(
  _estadoAnterior: ResultadoEntrada | null,
  formData: FormData
): Promise<ResultadoEntrada> {
  const email = String(formData.get('email') ?? '').trim()
  const senha = String(formData.get('senha') ?? '')

  if (!email || !senha) return { ok: false, erro: ERRO_CREDENCIAIS }

  const origem = await origemDoPedido()

  // As funções de contagem têm execução revogada de todos os papéis de aplicação
  // — quem está a tentar entrar não pode ler nem apagar o seu próprio rasto.
  // Só a credencial de serviço lhes chega.
  const admin = createAdminClient()

  const { data: bloqueada } = await admin.rpc('entrada_bloqueada', { p_origem: origem })

  if (bloqueada === true) {
    return {
      ok: false,
      erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente novamente.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    await admin.rpc('registar_tentativa_falhada', { p_origem: origem })
    return { ok: false, erro: ERRO_CREDENCIAIS }
  }

  await admin.rpc('limpar_tentativas', { p_origem: origem })

  // Uma conta válida que não conste da lista de administradores autentica com
  // sucesso e é reencaminhada pelo middleware. A distinção não é exposta aqui,
  // pelo mesmo motivo de FR-021.
  redirect('/admin/produtos')
}

/**
 * Termina a sessão (FR-030).
 *
 * Não exige `is_admin()`: quem detém a sessão pode encerrá-la. Antes desta
 * feature não havia forma de sair do painel — a sessão só terminava por
 * expiração ou limpeza manual do navegador, inaceitável em computador partilhado.
 */
export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
