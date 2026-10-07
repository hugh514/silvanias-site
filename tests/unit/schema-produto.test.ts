import { describe, expect, it } from 'vitest'

import { CATEGORIAS } from '@/lib/constants'
import { MAX_FOTOS, produtoSchema, validarFormularioProduto } from '@/lib/schemas/produto'

function formulario(campos: Record<string, string | string[]>): FormData {
  const fd = new FormData()
  for (const [chave, valor] of Object.entries(campos)) {
    if (Array.isArray(valor)) valor.forEach((v) => fd.append(chave, v))
    else fd.set(chave, valor)
  }
  return fd
}

const VALIDO = {
  nome: 'Chocolate 80%',
  categoria: CATEGORIAS[0],
  descricao: 'Feito com cacau próprio.',
  ingredientes: 'Cacau, açúcar',
  disponivel: 'sim',
}

describe('produtoSchema', () => {
  it('aceita_produto_completo', () => {
    const r = produtoSchema.safeParse({
      nome: 'Chocolate 80%',
      categoria: CATEGORIAS[0],
      descricao: 'Feito com cacau próprio.',
      ingredientes: 'Cacau, açúcar',
      disponivel: true,
      fotosExistentes: [],
    })
    expect(r.success).toBe(true)
  })

  it('recusa_nome_vazio', () => {
    const r = produtoSchema.safeParse({
      nome: '   ',
      categoria: CATEGORIAS[0],
      descricao: '',
      ingredientes: '',
      disponivel: true,
      fotosExistentes: [],
    })
    expect(r.success).toBe(false)
  })

  it('recusa_nome_acima_de_cento_e_vinte_caracteres', () => {
    const r = produtoSchema.safeParse({
      nome: 'a'.repeat(121),
      categoria: CATEGORIAS[0],
      descricao: '',
      ingredientes: '',
      disponivel: true,
      fotosExistentes: [],
    })
    expect(r.success).toBe(false)
  })

  it('aceita_nome_exatamente_no_limite', () => {
    const r = produtoSchema.safeParse({
      nome: 'a'.repeat(120),
      categoria: CATEGORIAS[0],
      descricao: '',
      ingredientes: '',
      disponivel: true,
      fotosExistentes: [],
    })
    expect(r.success).toBe(true)
  })

  it('recusa_categoria_fora_da_lista', () => {
    const r = produtoSchema.safeParse({
      nome: 'Chocolate',
      categoria: 'Categoria Inventada',
      descricao: '',
      ingredientes: '',
      disponivel: true,
      fotosExistentes: [],
    })
    expect(r.success).toBe(false)
  })

  it('recusa_mais_fotos_do_que_o_maximo', () => {
    const r = produtoSchema.safeParse({
      nome: 'Chocolate',
      categoria: CATEGORIAS[0],
      descricao: '',
      ingredientes: '',
      disponivel: true,
      fotosExistentes: Array.from(
        { length: MAX_FOTOS + 1 },
        (_, i) => `https://exemplo.com/${i}.jpg`
      ),
    })
    expect(r.success).toBe(false)
  })
})

describe('validarFormularioProduto', () => {
  it('converte_campos_opcionais_vazios_em_nulo', () => {
    // Evita ter dois valores distintos — '' e null — a significar "sem descrição".
    const r = validarFormularioProduto(
      formulario({ ...VALIDO, descricao: '', ingredientes: '   ' })
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.dados.descricao).toBeNull()
      expect(r.dados.ingredientes).toBeNull()
    }
  })

  it('remove_espacos_nas_pontas_do_nome', () => {
    const r = validarFormularioProduto(formulario({ ...VALIDO, nome: '  Brigadeiro  ' }))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dados.nome).toBe('Brigadeiro')
  })

  it('interpreta_disponivel_nao_como_falso', () => {
    const r = validarFormularioProduto(formulario({ ...VALIDO, disponivel: 'nao' }))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dados.disponivel).toBe(false)
  })

  it('trata_disponivel_em_falta_como_falso', () => {
    const fd = formulario(VALIDO)
    fd.delete('disponivel')
    const r = validarFormularioProduto(fd)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dados.disponivel).toBe(false)
  })

  it('devolve_erro_por_campo_e_nao_apenas_uma_mensagem', () => {
    const r = validarFormularioProduto(
      formulario({ ...VALIDO, nome: '', categoria: 'Inexistente' })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.camposComErro.nome).toBeTruthy()
      expect(r.camposComErro.categoria).toBeTruthy()
    }
  })

  it('recolhe_varias_fotos_existentes_do_formulario', () => {
    const r = validarFormularioProduto(
      formulario({
        ...VALIDO,
        fotosExistentes: ['https://exemplo.com/a.jpg', 'https://exemplo.com/b.jpg'],
      })
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.dados.fotosExistentes).toHaveLength(2)
  })

  it('recusa_foto_existente_que_nao_e_endereco_valido', () => {
    const r = validarFormularioProduto(
      formulario({ ...VALIDO, fotosExistentes: ['nao-e-url'] })
    )
    expect(r.ok).toBe(false)
  })

  it('aceita_foto_existente_das_imagens_do_site', () => {
    const r = validarFormularioProduto(
      formulario({ ...VALIDO, fotosExistentes: ['/images/categoria-chocolate-v3.png'] })
    )
    expect(r.ok).toBe(true)
  })

  it('recusa_caminho_relativo_fora_de_images', () => {
    const r = validarFormularioProduto(formulario({ ...VALIDO, fotosExistentes: ['/admin/x.png'] }))
    expect(r.ok).toBe(false)
  })

  it('usa_ordem_zero_e_sem_destaque_quando_omitidos', () => {
    const r = validarFormularioProduto(formulario(VALIDO))
    expect(r.ok && { ordem: r.dados.ordem, destaque: r.dados.destaque }).toEqual({ ordem: 0, destaque: false })
  })

  it('le_ordem_e_destaque_do_formulario', () => {
    const r = validarFormularioProduto(formulario({ ...VALIDO, ordem: '3', destaque: 'sim' }))
    expect(r.ok && { ordem: r.dados.ordem, destaque: r.dados.destaque }).toEqual({ ordem: 3, destaque: true })
  })

  it('recusa_ordem_que_nao_e_inteiro', () => {
    const r = validarFormularioProduto(formulario({ ...VALIDO, ordem: '1.5' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.camposComErro.ordem).toBeDefined()
  })

  it('recusa_ordem_fora_do_intervalo', () => {
    expect(validarFormularioProduto(formulario({ ...VALIDO, ordem: '100000' })).ok).toBe(false)
  })
})
