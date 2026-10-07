import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * T047-T049 — invariantes das ações de servidor.
 *
 * Prova que a verificação de autorização acontece ANTES de qualquer escrita, e
 * que é independente das políticas da base de dados. As duas camadas existem de
 * propósito: confiar apenas numa foi o que causou esta feature.
 *
 * Usa dublês em vez de base de dados real, por dois motivos: corre em
 * milissegundos e sem ambiente, e permite afirmar o que interessa aqui — que
 * NENHUMA escrita foi sequer tentada quando a autorização falha. Contra uma base
 * real só se veria a escrita ser recusada, não que nunca chegou a ser feita.
 *
 * A prova de que as políticas também negam está em
 * tests/integration/acesso-negado.test.ts, contra Supabase a sério.
 *
 * (O plano previa este ficheiro em tests/integration/. Ficou em unit porque não
 * toca em rede nem em base de dados, e assim corre em cada commit.)
 */

const verificarAdmin = vi.fn()
const revalidatePath = vi.fn()

/** Regista toda a tentativa de escrita, para provar que nem chegou a acontecer. */
const escritas: string[] = []

function construirClienteFalso() {
  const storage = {
    from: () => ({
      upload: vi.fn(async () => {
        escritas.push('storage.upload')
        return { error: null }
      }),
      remove: vi.fn(async () => {
        escritas.push('storage.remove')
        return { error: null }
      }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://exemplo/x.png' } }),
    }),
  }

  return {
    storage,
    from: () => ({
      insert: vi.fn(async () => {
        escritas.push('db.insert')
        return { error: null }
      }),
      update: () => ({
        eq: vi.fn(async () => {
          escritas.push('db.update')
          return { error: null }
        }),
      }),
      delete: () => ({
        eq: vi.fn(async () => {
          escritas.push('db.delete')
          return { error: null }
        }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { fotos: [] }, error: null }),
        }),
      }),
    }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  verificarAdmin: () => verificarAdmin(),
  createClient: async () => construirClienteFalso(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))

const { atualizarProduto, criarProduto, removerProduto, reordenarProdutos } = await import(
  '@/lib/actions/produtos'
)

function formularioValido(): FormData {
  const fd = new FormData()
  fd.set('nome', 'Chocolate 70%')
  fd.set('categoria', 'Chocolate')
  fd.set('descricao', '')
  fd.set('ingredientes', '')
  fd.set('disponivel', 'sim')
  return fd
}

beforeEach(() => {
  escritas.length = 0
  verificarAdmin.mockReset()
  revalidatePath.mockReset()
})

describe('autorização antes de qualquer escrita', () => {
  for (const motivo of ['sem-sessao', 'nao-admin'] as const) {
    describe(`quando a verificação devolve "${motivo}"`, () => {
      beforeEach(() => {
        verificarAdmin.mockResolvedValue({ autorizado: false, motivo })
      })

      it('criar_recusa_sem_tentar_escrever', async () => {
        const r = await criarProduto(null, formularioValido())
        expect(r.ok).toBe(false)
        expect(escritas, 'houve tentativa de escrita apesar da recusa').toEqual([])
      })

      it('atualizar_recusa_sem_tentar_escrever', async () => {
        const r = await atualizarProduto('id-qualquer', null, formularioValido())
        expect(r.ok).toBe(false)
        expect(escritas).toEqual([])
      })

      it('remover_recusa_sem_tentar_escrever', async () => {
        const r = await removerProduto('id-qualquer')
        expect(r.ok).toBe(false)
        expect(escritas).toEqual([])
      })

      it('nao_revalida_caminhos_quando_recusa', async () => {
        await criarProduto(null, formularioValido())
        expect(revalidatePath).not.toHaveBeenCalled()
      })
    })
  }

  it('mensagem_de_sessao_expirada_e_distinta_da_de_falta_de_permissao', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: false, motivo: 'sem-sessao' })
    const semSessao = await criarProduto(null, formularioValido())

    verificarAdmin.mockResolvedValue({ autorizado: false, motivo: 'nao-admin' })
    const semPermissao = await criarProduto(null, formularioValido())

    // Aqui a distinção é útil e inofensiva: quem já está autenticado não ganha
    // nada em saber a diferença, mas quem tem a sessão expirada precisa de saber
    // que basta entrar de novo. Não é o caso do formulário de entrada, onde
    // FR-021 exige mensagens indistinguíveis.
    expect(semSessao.ok).toBe(false)
    expect(semPermissao.ok).toBe(false)
    if (!semSessao.ok && !semPermissao.ok) {
      expect(semSessao.erro).not.toBe(semPermissao.erro)
      expect(semSessao.erro).toContain('sessão')
      expect(semPermissao.erro).toContain('permissão')
    }
  })
})

describe('validação depois da autorização', () => {
  beforeEach(() => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'admin-1' })
  })

  it('recusa_nome_vazio_sem_escrever', async () => {
    const fd = formularioValido()
    fd.set('nome', '   ')

    const r = await criarProduto(null, fd)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.camposComErro?.nome).toBeTruthy()
    expect(escritas).toEqual([])
  })

  it('recusa_categoria_desconhecida_sem_escrever', async () => {
    const fd = formularioValido()
    fd.set('categoria', 'Categoria Inventada')

    const r = await criarProduto(null, fd)
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
  })

  it('cria_e_revalida_quando_tudo_esta_certo', async () => {
    const r = await criarProduto(null, formularioValido())
    expect(r.ok).toBe(true)
    expect(escritas).toContain('db.insert')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/produtos')
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('remover_apaga_ficheiros_antes_da_linha', async () => {
    // Ordem deliberada: se a remoção da linha falhar depois, ficam ficheiros em
    // falta para um produto que ainda existe — visível e corrigível. A ordem
    // inversa deixaria órfãos invisíveis.
    await removerProduto('id-1')
    const iStorage = escritas.indexOf('storage.remove')
    const iLinha = escritas.indexOf('db.delete')

    if (iStorage !== -1) expect(iStorage).toBeLessThan(iLinha)
    expect(iLinha).toBeGreaterThanOrEqual(0)
  })
})

describe('mensagens de erro não expõem detalhes internos (FR-029)', () => {
  beforeEach(() => {
    verificarAdmin.mockResolvedValue({ autorizado: false, motivo: 'nao-admin' })
  })

  it('nao_contem_codigos_nem_nomes_de_esquema', async () => {
    const resultados = [
      await criarProduto(null, formularioValido()),
      await atualizarProduto('x', null, formularioValido()),
      await removerProduto('x'),
    ]

    const proibidos = [
      '42501', // violação de política de acesso
      '23502', // campo obrigatório em falta
      '23505', // chave duplicada
      'row-level security',
      'relation "',
      'public.',
      'pg_',
    ]

    for (const r of resultados) {
      expect(r.ok).toBe(false)
      if (!r.ok) {
        for (const termo of proibidos) {
          expect(
            r.erro.toLowerCase(),
            `a mensagem "${r.erro}" expõe "${termo}" ao navegador`
          ).not.toContain(termo.toLowerCase())
        }
      }
    }
  })
})

describe('reordenarProdutos', () => {
  const UUID_A = '11111111-1111-4111-8111-111111111111'
  const UUID_B = '22222222-2222-4222-8222-222222222222'

  it('recusa_quem_nao_e_admin_sem_escrever', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: false, motivo: 'nao-admin' })
    const r = await reordenarProdutos([UUID_A, UUID_B])
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
  })

  it('recusa_lista_com_id_invalido_sem_escrever', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await reordenarProdutos([UUID_A, "1; drop table produtos"])
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
  })

  it('recusa_ids_repetidos_sem_escrever', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await reordenarProdutos([UUID_A, UUID_A])
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
  })

  it('grava_uma_posicao_por_produto_e_revalida', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await reordenarProdutos([UUID_B, UUID_A])
    expect(r.ok).toBe(true)
    expect(escritas.filter((e) => e === 'db.update')).toHaveLength(2)
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })
})
