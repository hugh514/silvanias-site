import { z } from 'zod'

import { ENDERECO, INSTAGRAM_URL } from '@/lib/constants'

/**
 * Conteúdo editável da vitrine (tabela `conteudo_site`, uma linha por chave).
 *
 * Só TEXTO é editável. Imagens, URL do mapa e WhatsApp ficam no código de
 * propósito: um campo de URL livre no painel é uma porta para injetar links ou
 * iframes de terceiros na página pública.
 */

const texto = (max: number, rotulo: string) =>
  z.string().trim().min(1, `Preencha ${rotulo}.`).max(max, `${rotulo} deve ter no máximo ${max} caracteres.`)

const ESQUEMAS = {
  hero: z.object({
    titulo: texto(120, 'o título'),
    descricao: texto(400, 'a descrição'),
  }),
  marquee: z.object({
    mensagem: texto(120, 'a mensagem'),
  }),
  quem_somos: z.object({
    titulo: texto(120, 'o título'),
    texto: texto(1500, 'o texto'),
  }),
  onde_encontrar: z.object({
    endereco: texto(300, 'o endereço'),
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
  }),
  rodape: z.object({
    frase: texto(160, 'a frase'),
    instagram_url: z
      .string()
      .trim()
      .regex(/^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/, 'Use um endereço https://instagram.com/…'),
  }),
} as const

export type ChaveConteudo = keyof typeof ESQUEMAS
export type Conteudo<C extends ChaveConteudo> = z.output<(typeof ESQUEMAS)[C]>
export type ConteudoSite = { [C in ChaveConteudo]: Conteudo<C> }

export const CHAVES_CONTEUDO = Object.keys(ESQUEMAS) as ChaveConteudo[]

/** Usado quando a linha falta ou está inválida — a vitrine nunca fica vazia. */
export const CONTEUDO_PADRAO: ConteudoSite = {
  hero: {
    titulo: 'Chocolates artesanais que dão água na boca',
    descricao:
      "Todos os produtos da Silvania's Cacau são feitos com cacau próprio, garantindo origem, qualidade e rastreabilidade do cultivo à produção.",
  },
  marquee: { mensagem: 'A arte de transformar paixão em sabor' },
  quem_somos: {
    titulo: 'Aqui na Amazônia o cacau encontra seu lar',
    texto:
      "Somos uma agroindústria de cacau. Cultivamos o fruto que dá vida aos nossos produtos, e a Silvania's Cacau nasce desse encontro entre o cultivo e a arte de transformar.",
  },
  onde_encontrar: {
    endereco: `${ENDERECO.rua}\n${ENDERECO.cidade}\n${ENDERECO.cep}`,
    lat: ENDERECO.latitude,
    lng: ENDERECO.longitude,
  },
  rodape: {
    frase: 'A arte de transformar paixão em sabor.',
    instagram_url: INSTAGRAM_URL,
  },
}

export type CamposComErroConteudo = Record<string, string>

export function validarConteudo<C extends ChaveConteudo>(
  chave: C,
  bruto: unknown
): { ok: true; dados: Conteudo<C> } | { ok: false; camposComErro: CamposComErroConteudo } {
  const esquema = (ESQUEMAS as Record<string, z.ZodType | undefined>)[chave] as z.ZodType<Conteudo<C>> | undefined
  if (!esquema) return { ok: false, camposComErro: { _: 'Secção desconhecida.' } }

  const r = esquema.safeParse(bruto)
  if (r.success) return { ok: true, dados: r.data }

  const camposComErro: CamposComErroConteudo = {}
  for (const p of r.error.issues) {
    const campo = String(p.path[0] ?? '_')
    camposComErro[campo] ??= p.message
  }
  return { ok: false, camposComErro }
}
