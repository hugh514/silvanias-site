import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  clienteAnonimo,
  clienteServico,
  criarProdutoDeTeste,
  criarUtilizadorDescartavel,
  despromover,
  pngMinimo,
  promoverAAdmin,
  type UtilizadorDescartavel,
} from './helpers/utilizador-descartavel'

/**
 * SUITE CENTRAL DE REGRESSÃO.
 *
 * Reproduz, passo a passo, a cadeia de ataque confirmada contra produção a
 * 2026-07-25, e exige que TODOS os passos falhem.
 *
 * Resultados da altura, para referência:
 *   1. chave anónima lida do pacote JavaScript ......... trivial
 *   2. registo de conta aberto ......................... HTTP 200
 *   3. autenticação → token com papel `authenticated` .. HTTP 200
 *   4. criar produto ................................... 23502  ← o RLS deixou
 *      passar; só a restrição de campo obrigatório travou
 *   5. alterar e remover ............................... HTTP 204
 *   6. enviar ficheiro para o armazenamento ............ HTTP 200, ficheiro real criado
 *
 * O Princípio VI da constituição faz destes testes um requisito, não um extra:
 * nenhuma alteração às regras de acesso vai para produção sem prova de que o
 * acesso não autorizado é NEGADO.
 */

const BUCKET = 'produtos'

/** Uma escrita bem-sucedida significa que a defesa falhou. */
function esperarNegado(resultado: { error: unknown; data?: unknown }, contexto: string) {
  expect(resultado.error, `${contexto} — deveria ter sido NEGADO mas passou`).not.toBeNull()
}

describe('cadeia de ataque de 2026-07-25', () => {
  let intruso: UtilizadorDescartavel
  let produtoDisponivel: Awaited<ReturnType<typeof criarProdutoDeTeste>>
  let produtoIndisponivel: Awaited<ReturnType<typeof criarProdutoDeTeste>>

  beforeAll(async () => {
    intruso = await criarUtilizadorDescartavel()
    produtoDisponivel = await criarProdutoDeTeste(true)
    produtoIndisponivel = await criarProdutoDeTeste(false)
  })

  afterAll(async () => {
    // Bloco de limpeza: corre mesmo que os testes rebentem a meio.
    await produtoDisponivel?.apagar()
    await produtoIndisponivel?.apagar()
    await intruso?.apagar()
  })

  // ---------------------------------------------------------------------------
  // T018 — escrita em produtos negada a autenticado fora da lista
  // ---------------------------------------------------------------------------
  describe('conta autenticada fora da lista de administradores', () => {
    it('nao_consegue_criar_produto', async () => {
      const r = await intruso.cliente
        .from('produtos')
        .insert({ nome: 'Invasão', categoria: 'Chocolate' })
      esperarNegado(r, 'criar produto')
    })

    it('nao_consegue_alterar_produto', async () => {
      const r = await intruso.cliente
        .from('produtos')
        .update({ nome: 'Adulterado' })
        .eq('id', produtoDisponivel.id)
        .select()

      // Uma política de alteração ausente filtra em silêncio: sem erro, mas
      // também sem linhas afetadas. Verificar as duas coisas.
      const naoAlterou = r.error !== null || (r.data ?? []).length === 0
      expect(naoAlterou, 'alterar produto — deveria ter sido NEGADO').toBe(true)

      const { data: depois } = await clienteServico()
        .from('produtos')
        .select('nome')
        .eq('id', produtoDisponivel.id)
        .single()
      expect(depois?.nome).not.toBe('Adulterado')
    })

    it('nao_consegue_remover_produto', async () => {
      await intruso.cliente.from('produtos').delete().eq('id', produtoDisponivel.id)

      // O que interessa não é o código devolvido, é o produto continuar lá.
      const { data } = await clienteServico()
        .from('produtos')
        .select('id')
        .eq('id', produtoDisponivel.id)
        .maybeSingle()
      expect(data, 'o produto foi removido por quem não é administrador').not.toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // T019 — armazenamento negado a autenticado fora da lista
  // ---------------------------------------------------------------------------
  describe('armazenamento, conta fora da lista', () => {
    it('nao_consegue_enviar_ficheiro', async () => {
      const r = await intruso.cliente.storage
        .from(BUCKET)
        .upload(`intrusao-${crypto.randomUUID()}.png`, pngMinimo(), {
          contentType: 'image/png',
        })
      esperarNegado(r, 'enviar ficheiro')
    })

    it('nao_consegue_substituir_ficheiro', async () => {
      const r = await intruso.cliente.storage
        .from(BUCKET)
        .upload(`intrusao-${crypto.randomUUID()}.png`, pngMinimo(), {
          contentType: 'image/png',
          upsert: true,
        })
      esperarNegado(r, 'substituir ficheiro')
    })

    it('nao_consegue_remover_ficheiro', async () => {
      const caminho = `alvo-${crypto.randomUUID()}.png`
      const servico = clienteServico()
      await servico.storage.from(BUCKET).upload(caminho, pngMinimo(), {
        contentType: 'image/png',
      })

      try {
        await intruso.cliente.storage.from(BUCKET).remove([caminho])

        const { data } = await servico.storage.from(BUCKET).list('', { search: caminho })
        expect(data?.length, 'o ficheiro foi removido por quem não é administrador').toBe(1)
      } finally {
        await servico.storage.from(BUCKET).remove([caminho])
      }
    })
  })

  // ---------------------------------------------------------------------------
  // T020 — leitura de indisponível negada (FR-011)
  // ---------------------------------------------------------------------------
  describe('produtos indisponíveis', () => {
    it('nao_sao_visiveis_a_visitante_anonimo', async () => {
      const { data } = await clienteAnonimo()
        .from('produtos')
        .select('id')
        .eq('id', produtoIndisponivel.id)
        .maybeSingle()
      expect(data).toBeNull()
    })

    it('nao_sao_visiveis_a_autenticado_fora_da_lista', async () => {
      const { data } = await intruso.cliente
        .from('produtos')
        .select('id')
        .eq('id', produtoIndisponivel.id)
        .maybeSingle()
      expect(data).toBeNull()
    })

    it('disponiveis_continuam_visiveis_a_anonimo', async () => {
      // FR-010 e SC-003: fechar o acesso não pode fechar a vitrine.
      const { data } = await clienteAnonimo()
        .from('produtos')
        .select('id')
        .eq('id', produtoDisponivel.id)
        .maybeSingle()
      expect(data?.id).toBe(produtoDisponivel.id)
    })
  })

  // ---------------------------------------------------------------------------
  // T021 — controlos positivos
  //
  // Sem estes, uma política que negue TUDO passaria em todos os testes acima e
  // partiria o painel em silêncio. Provam que a defesa distingue, em vez de
  // simplesmente bloquear.
  // ---------------------------------------------------------------------------
  describe('administrador na lista', () => {
    let admin: UtilizadorDescartavel

    beforeAll(async () => {
      admin = await criarUtilizadorDescartavel()
      await promoverAAdmin(admin.id)
      // Renova o token para que o pedido seguinte já reflita a promoção.
      await admin.cliente.auth.refreshSession()
    })

    afterAll(async () => {
      await admin?.apagar()
    })

    it('consegue_criar_produto', async () => {
      const { data, error } = await admin.cliente
        .from('produtos')
        .insert({ nome: 'Criado pelo admin', categoria: 'Chocolate' })
        .select('id')
        .single()

      expect(error).toBeNull()
      expect(data?.id).toBeTruthy()

      if (data?.id) await clienteServico().from('produtos').delete().eq('id', data.id)
    })

    it('consegue_alterar_produto', async () => {
      const { error } = await admin.cliente
        .from('produtos')
        .update({ nome: 'Nome novo pelo admin' })
        .eq('id', produtoDisponivel.id)
      expect(error).toBeNull()
    })

    it('consegue_remover_produto', async () => {
      const alvo = await criarProdutoDeTeste(true)
      const { error } = await admin.cliente.from('produtos').delete().eq('id', alvo.id)
      expect(error).toBeNull()

      const { data } = await clienteServico()
        .from('produtos')
        .select('id')
        .eq('id', alvo.id)
        .maybeSingle()
      expect(data).toBeNull()
    })

    it('ve_produtos_indisponiveis', async () => {
      // FR-012 — o painel precisa de gerir o que o público não vê.
      const { data } = await admin.cliente
        .from('produtos')
        .select('id')
        .eq('id', produtoIndisponivel.id)
        .maybeSingle()
      expect(data?.id).toBe(produtoIndisponivel.id)
    })

    it('consegue_enviar_ficheiro', async () => {
      const caminho = `admin-${crypto.randomUUID()}.png`
      const { error } = await admin.cliente.storage
        .from(BUCKET)
        .upload(caminho, pngMinimo(), { contentType: 'image/png' })

      expect(error).toBeNull()
      await clienteServico().storage.from(BUCKET).remove([caminho])
    })
  })

  // ---------------------------------------------------------------------------
  // T064 — revogação tem efeito no pedido seguinte (FR-005)
  //
  // É a prova que faltava. FR-005 é a única justificação registada para termos
  // rejeitado embutir a reivindicação de administrador no token (decisão D3):
  // um token vive até renovar, e durante esse tempo um administrador removido
  // continuaria a escrever. Sem este teste, D3 era uma afirmação sem suporte.
  // ---------------------------------------------------------------------------
  describe('revogação de administrador', () => {
    it('deixa_de_escrever_no_pedido_seguinte_sem_reautenticar', async () => {
      const efemero = await criarUtilizadorDescartavel()

      try {
        await promoverAAdmin(efemero.id)
        await efemero.cliente.auth.refreshSession()

        // Confirma que estava mesmo a escrever antes da revogação — caso
        // contrário o teste passaria por já estar bloqueado por outro motivo.
        const antes = await efemero.cliente
          .from('produtos')
          .insert({ nome: 'Antes da revogação', categoria: 'Chocolate' })
          .select('id')
          .single()

        expect(antes.error, 'o administrador deveria conseguir escrever antes da revogação')
          .toBeNull()

        if (antes.data?.id) {
          await clienteServico().from('produtos').delete().eq('id', antes.data.id)
        }

        // Revogação. A sessão continua aberta e o token é EXATAMENTE o mesmo.
        await despromover(efemero.id)

        const depois = await efemero.cliente
          .from('produtos')
          .insert({ nome: 'Depois da revogação', categoria: 'Chocolate' })
          .select('id')
          .single()

        expect(
          depois.error,
          'FR-005 violado: escreveu depois de ser removido da lista, com a mesma sessão'
        ).not.toBeNull()
      } finally {
        await efemero.apagar()
      }
    })
  })
})
