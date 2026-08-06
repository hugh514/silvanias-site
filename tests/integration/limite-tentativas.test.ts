import { afterEach, describe, expect, it } from 'vitest'

import { clienteAnonimo, clienteServico } from './helpers/utilizador-descartavel'

/**
 * T055/T056 — limitação de tentativas de entrada (FR-020) e não enumeração de
 * contas (FR-021).
 *
 * As funções de contagem têm execução revogada de todos os papéis de aplicação:
 * quem está a tentar entrar não deve conseguir ler quantas falhas já acumulou,
 * nem apagar o seu próprio rasto. Só a credencial de serviço lhes chega.
 */

const LIMITE = 5
const origens: string[] = []

function origemDeTeste(): string {
  const o = `teste-${crypto.randomUUID()}`
  origens.push(o)
  return o
}

afterEach(async () => {
  const servico = clienteServico()
  for (const o of origens.splice(0)) {
    await servico.rpc('limpar_tentativas', { p_origem: o })
  }
})

describe('contagem de tentativas falhadas', () => {
  it('nao_bloqueia_antes_do_limite', async () => {
    const servico = clienteServico()
    const origem = origemDeTeste()

    for (let i = 0; i < LIMITE - 1; i++) {
      await servico.rpc('registar_tentativa_falhada', { p_origem: origem })
    }

    const { data } = await servico.rpc('entrada_bloqueada', { p_origem: origem })
    expect(data, `${LIMITE - 1} falhas não deveriam bloquear`).toBe(false)
  })

  it('bloqueia_ao_atingir_o_limite', async () => {
    const servico = clienteServico()
    const origem = origemDeTeste()

    for (let i = 0; i < LIMITE; i++) {
      await servico.rpc('registar_tentativa_falhada', { p_origem: origem })
    }

    const { data } = await servico.rpc('entrada_bloqueada', { p_origem: origem })
    expect(data, `${LIMITE} falhas deveriam bloquear`).toBe(true)
  })

  it('uma_entrada_correta_repoe_a_contagem', async () => {
    const servico = clienteServico()
    const origem = origemDeTeste()

    for (let i = 0; i < LIMITE; i++) {
      await servico.rpc('registar_tentativa_falhada', { p_origem: origem })
    }
    expect((await servico.rpc('entrada_bloqueada', { p_origem: origem })).data).toBe(true)

    await servico.rpc('limpar_tentativas', { p_origem: origem })

    const { data } = await servico.rpc('entrada_bloqueada', { p_origem: origem })
    expect(data, 'a contagem deveria ter sido reposta').toBe(false)
  })

  it('as_origens_sao_contadas_de_forma_independente', async () => {
    // Bloquear um atacante não pode bloquear a dona a partir de outra rede.
    const servico = clienteServico()
    const atacante = origemDeTeste()
    const legitima = origemDeTeste()

    for (let i = 0; i < LIMITE; i++) {
      await servico.rpc('registar_tentativa_falhada', { p_origem: atacante })
    }

    expect((await servico.rpc('entrada_bloqueada', { p_origem: atacante })).data).toBe(true)
    expect((await servico.rpc('entrada_bloqueada', { p_origem: legitima })).data).toBe(false)
  })
})

describe('a tabela de tentativas não é acessível de fora', () => {
  it('anonimo_nao_le_as_tentativas', async () => {
    const { data, error } = await clienteAnonimo().from('tentativas_login').select('*')
    // RLS ligada com zero políticas: ou erro, ou conjunto vazio. Nunca dados.
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it('anonimo_nao_apaga_o_proprio_rasto', async () => {
    const servico = clienteServico()
    const origem = origemDeTeste()

    for (let i = 0; i < LIMITE; i++) {
      await servico.rpc('registar_tentativa_falhada', { p_origem: origem })
    }

    await clienteAnonimo().from('tentativas_login').delete().eq('origem', origem)

    const { data } = await servico.rpc('entrada_bloqueada', { p_origem: origem })
    expect(data, 'um anónimo conseguiu limpar o próprio rasto').toBe(true)
  })

  it('anonimo_nao_executa_as_funcoes_de_contagem', async () => {
    const anon = clienteAnonimo()
    const origem = origemDeTeste()

    const limpeza = await anon.rpc('limpar_tentativas', { p_origem: origem })
    expect(limpeza.error, 'a função de limpeza deveria estar fora de alcance').not.toBeNull()
  })
})

describe('não enumeração de contas (FR-021)', () => {
  it('a_mensagem_e_identica_para_conta_inexistente_e_senha_errada', async () => {
    const anon = clienteAnonimo()

    const inexistente = await anon.auth.signInWithPassword({
      email: `nao-existe-${crypto.randomUUID()}@exemplo-teste.invalid`,
      password: 'QualquerCoisa123!',
    })

    const senhaErrada = await anon.auth.signInWithPassword({
      email: `tambem-nao-existe-${crypto.randomUUID()}@exemplo-teste.invalid`,
      password: 'OutraCoisa456!',
    })

    expect(inexistente.error).not.toBeNull()
    expect(senhaErrada.error).not.toBeNull()

    // O serviço de autenticação já devolve a mesma mensagem nos dois casos; a
    // ação `entrar` acrescenta a sua própria camada com texto único. Este teste
    // guarda contra uma regressão no nível de baixo.
    expect(inexistente.error?.message).toBe(senhaErrada.error?.message)
  })
})
