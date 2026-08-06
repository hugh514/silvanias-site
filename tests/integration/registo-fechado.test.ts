import { describe, expect, it } from 'vitest'

import { clienteAnonimo } from './helpers/utilizador-descartavel'

/**
 * T065 — guarda permanente sobre FR-007.
 *
 * O registo de contas por iniciativa própria é o PRIMEIRO degrau da cadeia de
 * ataque de 2026-07-25. Fechá-lo quebra a cadeia sozinho, e é uma definição de
 * consola — o que significa que alguém pode voltar a ligá-lo com dois cliques,
 * sem passar por revisão de código e sem ninguém dar por isso.
 *
 * Estes testes existem para que isso não passe despercebido.
 *
 * O ambiente local acompanha a produção através de `enable_signup = false` em
 * supabase/config.toml, para que a verificação seja significativa nos dois lados.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

describe('registo público de contas', () => {
  it('esta_desligado_nas_definicoes_de_autenticacao', async () => {
    const resposta = await fetch(`${URL}/auth/v1/settings`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })

    expect(resposta.ok).toBe(true)

    const definicoes = (await resposta.json()) as { disable_signup?: boolean }

    expect(
      definicoes.disable_signup,
      'FR-007 violado: o registo público voltou a ficar ABERTO. ' +
        'Qualquer pessoa pode criar conta — é o primeiro degrau da cadeia de ataque.'
    ).toBe(true)
  })

  it('recusa_uma_tentativa_real_de_criar_conta', async () => {
    // A definição pode existir e não ser aplicada. Provar pelo comportamento.
    const { data, error } = await clienteAnonimo().auth.signUp({
      email: `tentativa.${crypto.randomUUID()}@exemplo-teste.invalid`,
      password: `Tentativa-${crypto.randomUUID()}!`,
    })

    expect(
      error,
      'FR-007 violado: um visitante anónimo conseguiu criar uma conta.'
    ).not.toBeNull()
    expect(data.user).toBeNull()
  })

  it('recusa_entrada_anonima', async () => {
    // Sessão anónima daria um token com papel `authenticated` sem qualquer
    // registo — contornaria o fecho do registo pela porta do lado.
    const { error } = await clienteAnonimo().auth.signInAnonymously()
    expect(error).not.toBeNull()
  })
})
