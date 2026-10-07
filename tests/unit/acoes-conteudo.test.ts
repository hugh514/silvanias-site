import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Ação `guardarConteudo`: autorização antes de qualquer escrita, validação por
 * secção, e revalidação da vitrine só quando grava. A negação pelo RLS está em
 * tests/integration/conteudo-site-rls.test.ts.
 */

const verificarAdmin = vi.fn()
const revalidatePath = vi.fn()
const escritas: unknown[] = []

vi.mock('@/lib/supabase/server', () => ({
  verificarAdmin: () => verificarAdmin(),
  createClient: async () => ({
    from: () => ({
      update: (valores: unknown) => ({
        eq: () => ({
          select: async () => {
            escritas.push(valores)
            return { data: [{ chave: 'marquee' }], error: null }
          },
        }),
      }),
    }),
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))

const { guardarConteudo } = await import('@/lib/actions/conteudo-site')

function formulario(campos: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(campos)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  escritas.length = 0
  verificarAdmin.mockReset()
  revalidatePath.mockReset()
})

describe('guardarConteudo', () => {
  it('recusa_quem_nao_e_admin_sem_escrever', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: false, motivo: 'nao-admin' })
    const r = await guardarConteudo('marquee', null, formulario({ mensagem: 'Oi' }))
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('recusa_chave_desconhecida_sem_escrever', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await guardarConteudo('inventada' as never, null, formulario({}))
    expect(r.ok).toBe(false)
    expect(escritas).toEqual([])
  })

  it('recusa_campo_vazio_com_erro_no_campo', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await guardarConteudo('marquee', null, formulario({ mensagem: '  ' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.camposComErro?.mensagem).toBeTruthy()
    expect(escritas).toEqual([])
  })

  it('converte_coordenadas_em_numero', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await guardarConteudo(
      'onde_encontrar',
      null,
      formulario({ endereco: 'Rua A', lat: '-11.9', lng: '-61.7' })
    )
    expect(r.ok).toBe(true)
    expect(escritas).toEqual([{ conteudo: { endereco: 'Rua A', lat: -11.9, lng: -61.7 } }])
  })

  it('grava_e_revalida_a_vitrine', async () => {
    verificarAdmin.mockResolvedValue({ autorizado: true, userId: 'a' })
    const r = await guardarConteudo('marquee', null, formulario({ mensagem: 'Nova faixa' }))
    expect(r.ok).toBe(true)
    expect(escritas).toEqual([{ conteudo: { mensagem: 'Nova faixa' } }])
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
})
