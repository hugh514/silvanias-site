import { describe, expect, it } from 'vitest'

import {
  CONTEUDO_PADRAO,
  validarConteudo,
  type ChaveConteudo,
} from '@/lib/schemas/conteudo-site'

describe('validarConteudo', () => {
  it.each(Object.keys(CONTEUDO_PADRAO) as ChaveConteudo[])('aceita_padrao_%s', (chave) => {
    expect(validarConteudo(chave, CONTEUDO_PADRAO[chave]).ok).toBe(true)
  })

  it('recusa_chave_desconhecida', () => {
    expect(validarConteudo('qualquer' as ChaveConteudo, {}).ok).toBe(false)
  })

  it('recusa_titulo_hero_vazio', () => {
    const r = validarConteudo('hero', { ...CONTEUDO_PADRAO.hero, titulo: '   ' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.camposComErro.titulo).toBeDefined()
  })

  it('apara_espacos_dos_textos', () => {
    const r = validarConteudo('marquee', { mensagem: '  Olá  ' })
    expect(r.ok && r.dados).toEqual({ mensagem: 'Olá' })
  })

  it('recusa_instagram_fora_do_instagram', () => {
    const r = validarConteudo('rodape', { ...CONTEUDO_PADRAO.rodape, instagram_url: 'https://evil.example/x' })
    expect(r.ok).toBe(false)
  })

  it('recusa_instagram_javascript', () => {
    const r = validarConteudo('rodape', { ...CONTEUDO_PADRAO.rodape, instagram_url: 'javascript:alert(1)' })
    expect(r.ok).toBe(false)
  })

  it('recusa_latitude_fora_do_intervalo', () => {
    const r = validarConteudo('onde_encontrar', { ...CONTEUDO_PADRAO.onde_encontrar, lat: 120 })
    expect(r.ok).toBe(false)
  })

  it('ignora_campos_extra', () => {
    const r = validarConteudo('marquee', { mensagem: 'Oi', script: '<script>' })
    expect(r.ok && r.dados).toEqual({ mensagem: 'Oi' })
  })
})
