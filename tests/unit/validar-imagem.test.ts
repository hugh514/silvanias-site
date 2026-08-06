import { describe, expect, it } from 'vitest'

import {
  TAMANHO_MAXIMO_BYTES,
  derivarCaminhoStorage,
  detetarTipoReal,
  gerarNomeArquivo,
  validarImagem,
} from '@/lib/upload/validar-imagem'

/** Constrói um buffer com a assinatura pedida seguida de enchimento. */
function comAssinatura(bytes: number[], tamanhoTotal = 64): Uint8Array {
  const buf = new Uint8Array(tamanhoTotal)
  buf.set(bytes, 0)
  return buf
}

function texto(s: string): number[] {
  return Array.from(s).map((c) => c.charCodeAt(0))
}

const JPEG = comAssinatura([0xff, 0xd8, 0xff, 0xe0])
const PNG = comAssinatura([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const WEBP = comAssinatura([...texto('RIFF'), 0x24, 0x00, 0x00, 0x00, ...texto('WEBP')])
const AVIF = comAssinatura([0x00, 0x00, 0x00, 0x20, ...texto('ftyp'), ...texto('avif')])
const AVIS = comAssinatura([0x00, 0x00, 0x00, 0x20, ...texto('ftyp'), ...texto('avis')])

describe('detetarTipoReal', () => {
  it('reconhece_jpeg_pela_assinatura', () => {
    expect(detetarTipoReal(JPEG)).toBe('image/jpeg')
  })

  it('reconhece_png_pela_assinatura', () => {
    expect(detetarTipoReal(PNG)).toBe('image/png')
  })

  it('reconhece_webp_por_riff_e_webp', () => {
    expect(detetarTipoReal(WEBP)).toBe('image/webp')
  })

  it('reconhece_avif_por_ftyp_e_marca', () => {
    expect(detetarTipoReal(AVIF)).toBe('image/avif')
    expect(detetarTipoReal(AVIS)).toBe('image/avif')
  })

  it('recusa_riff_sem_marca_webp', () => {
    // RIFF é contentor genérico — um WAV começa igual e não é imagem.
    const wav = comAssinatura([...texto('RIFF'), 0x24, 0, 0, 0, ...texto('WAVE')])
    expect(detetarTipoReal(wav)).toBeNull()
  })

  it('recusa_pdf_renomeado_para_jpg', () => {
    // O caso que importa: a extensão mente, os bytes não.
    const pdf = comAssinatura(texto('%PDF-1.7'))
    expect(detetarTipoReal(pdf)).toBeNull()
  })

  it('recusa_svg_por_nao_ser_formato_aceite', () => {
    // SVG é documento e pode conter script. Excluído deliberadamente.
    const svg = comAssinatura(texto('<svg xmlns="http://www.w3.org/2000/svg">'))
    expect(detetarTipoReal(svg)).toBeNull()
  })

  it('recusa_gif_por_nao_ser_formato_de_foto', () => {
    const gif = comAssinatura(texto('GIF89a'))
    expect(detetarTipoReal(gif)).toBeNull()
  })

  it('recusa_ficheiro_curto_demais_para_ter_assinatura', () => {
    expect(detetarTipoReal(new Uint8Array([0xff, 0xd8]))).toBeNull()
    expect(detetarTipoReal(new Uint8Array())).toBeNull()
  })
})

describe('validarImagem', () => {
  it('aceita_jpeg_dentro_do_limite', () => {
    const r = validarImagem(JPEG, 1024)
    expect(r).toEqual({ valido: true, tipo: 'image/jpeg' })
  })

  it('recusa_acima_de_cinco_megabytes', () => {
    const r = validarImagem(JPEG, TAMANHO_MAXIMO_BYTES + 1)
    expect(r.valido).toBe(false)
    if (!r.valido) expect(r.motivo).toContain('5 MB')
  })

  it('aceita_exatamente_no_limite', () => {
    // Fronteira: o limite é inclusivo.
    expect(validarImagem(JPEG, TAMANHO_MAXIMO_BYTES).valido).toBe(true)
  })

  it('recusa_ficheiro_vazio', () => {
    expect(validarImagem(new Uint8Array(), 0).valido).toBe(false)
  })

  it('recusa_pdf_renomeado_mesmo_dentro_do_limite', () => {
    const r = validarImagem(comAssinatura(texto('%PDF-1.7')), 1024)
    expect(r.valido).toBe(false)
    if (!r.valido) expect(r.motivo).toContain('não é uma imagem válida')
  })

  it('verifica_tamanho_antes_do_tipo', () => {
    // Um ficheiro enorme deve ser recusado sem depender de ler a assinatura.
    const r = validarImagem(new Uint8Array(0), TAMANHO_MAXIMO_BYTES + 1)
    expect(r.valido).toBe(false)
  })
})

describe('gerarNomeArquivo', () => {
  it('usa_extensao_do_tipo_detetado', () => {
    expect(gerarNomeArquivo('image/jpeg')).toMatch(/^[0-9a-f-]{36}\.jpg$/)
    expect(gerarNomeArquivo('image/png')).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(gerarNomeArquivo('image/webp')).toMatch(/^[0-9a-f-]{36}\.webp$/)
    expect(gerarNomeArquivo('image/avif')).toMatch(/^[0-9a-f-]{36}\.avif$/)
  })

  it('nao_contem_nada_escolhido_por_quem_envia', () => {
    // A função nem sequer recebe o nome original: não há por onde o injetar.
    // Percurso entre pastas, colisões e caracteres estranhos deixam de existir.
    const nome = gerarNomeArquivo('image/jpeg')
    expect(nome).not.toContain('/')
    expect(nome).not.toContain('..')
    expect(nome).not.toContain('\\')
  })

  it('gera_nomes_distintos_a_cada_chamada', () => {
    const nomes = new Set(Array.from({ length: 50 }, () => gerarNomeArquivo('image/png')))
    expect(nomes.size).toBe(50)
  })
})

describe('derivarCaminhoStorage', () => {
  const base = 'https://exemplo.supabase.co/storage/v1/object/public/produtos/'

  it('extrai_o_caminho_de_um_endereco_normal', () => {
    expect(derivarCaminhoStorage(`${base}abc-123.jpg`, 'produtos')).toBe('abc-123.jpg')
  })

  it('sobrevive_a_nome_que_contem_o_nome_do_bucket', () => {
    // O código anterior fazia url.split('/produtos/').pop() e devolvia 'foto.jpg',
    // deixando o ficheiro real por remover — órfão a ocupar espaço para sempre.
    const url = `${base}pasta/produtos/foto.jpg`
    expect(derivarCaminhoStorage(url, 'produtos')).toBe('pasta/produtos/foto.jpg')
  })

  it('descodifica_caracteres_escapados', () => {
    expect(derivarCaminhoStorage(`${base}a%20b.jpg`, 'produtos')).toBe('a b.jpg')
  })

  it('devolve_nulo_para_endereco_de_outro_bucket', () => {
    const outro = 'https://exemplo.supabase.co/storage/v1/object/public/outro/x.jpg'
    expect(derivarCaminhoStorage(outro, 'produtos')).toBeNull()
  })

  it('devolve_nulo_para_endereco_que_nao_e_do_storage', () => {
    expect(derivarCaminhoStorage('https://exemplo.com/produtos/x.jpg', 'produtos')).toBeNull()
  })

  it('devolve_nulo_quando_nao_ha_caminho_depois_do_prefixo', () => {
    expect(derivarCaminhoStorage(base, 'produtos')).toBeNull()
  })
})
