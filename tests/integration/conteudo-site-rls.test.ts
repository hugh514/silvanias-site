import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  clienteAnonimo,
  clienteServico,
  criarProdutoDeTeste,
  criarUtilizadorDescartavel,
  promoverAAdmin,
  type UtilizadorDescartavel,
} from './helpers/utilizador-descartavel'

/**
 * Fase 2: `conteudo_site` e as colunas `ordem`/`destaque`.
 * Leitura é pública; escrita só para quem está em `admins` — e o teste exige
 * que a escrita de um autenticado comum FALHE e não altere nada.
 */

describe('conteudo_site e ordem/destaque', () => {
  let intruso: UtilizadorDescartavel
  let admin: UtilizadorDescartavel
  let produto: Awaited<ReturnType<typeof criarProdutoDeTeste>>
  let marqueeOriginal: unknown

  beforeAll(async () => {
    intruso = await criarUtilizadorDescartavel()
    admin = await criarUtilizadorDescartavel()
    await promoverAAdmin(admin.id)
    produto = await criarProdutoDeTeste(true)
    const { data } = await clienteServico().from('conteudo_site').select('conteudo').eq('chave', 'marquee').single()
    marqueeOriginal = data?.conteudo
  })

  afterAll(async () => {
    await clienteServico().from('conteudo_site').update({ conteudo: marqueeOriginal as never }).eq('chave', 'marquee')
    await produto?.apagar()
    await intruso?.apagar()
    await admin?.apagar()
  })

  it('anonimo_le_todas_as_chaves', async () => {
    const { data, error } = await clienteAnonimo().from('conteudo_site').select('chave')
    expect(error).toBeNull()
    expect(data?.map((l) => l.chave).sort()).toEqual(['hero', 'marquee', 'onde_encontrar', 'quem_somos', 'rodape'])
  })

  it('autenticado_comum_nao_altera_conteudo', async () => {
    await intruso.cliente.from('conteudo_site').update({ conteudo: { mensagem: 'invadido' } }).eq('chave', 'marquee')
    const { data } = await clienteServico().from('conteudo_site').select('conteudo').eq('chave', 'marquee').single()
    expect(data?.conteudo).toEqual(marqueeOriginal)
  })

  it('autenticado_comum_nao_insere_chave_nova', async () => {
    const { error } = await intruso.cliente.from('conteudo_site').insert({ chave: 'x', conteudo: {} })
    expect(error).not.toBeNull()
  })

  it('autenticado_comum_nao_apaga_conteudo', async () => {
    await intruso.cliente.from('conteudo_site').delete().eq('chave', 'hero')
    const { count } = await clienteServico().from('conteudo_site').select('*', { count: 'exact', head: true })
    expect(count).toBe(5)
  })

  it('admin_altera_conteudo', async () => {
    const { error } = await admin.cliente
      .from('conteudo_site')
      .update({ conteudo: { mensagem: 'Nova faixa' } })
      .eq('chave', 'marquee')
    expect(error).toBeNull()
    const { data } = await clienteAnonimo().from('conteudo_site').select('conteudo').eq('chave', 'marquee').single()
    expect(data?.conteudo).toEqual({ mensagem: 'Nova faixa' })
  })

  it('autenticado_comum_nao_altera_ordem_nem_destaque', async () => {
    await intruso.cliente.from('produtos').update({ ordem: -50, destaque: true }).eq('id', produto.id)
    const { data } = await clienteServico().from('produtos').select('ordem, destaque').eq('id', produto.id).single()
    expect(data).toEqual({ ordem: 0, destaque: false })
  })
})
