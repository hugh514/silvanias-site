export const CATEGORIAS = ['Chocolate', 'Derivados do Cacau'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const NUMEROZAP = 'https://wa.me/5569984750156' as const
export type NumeroZap = typeof NUMEROZAP

export function gerarLinkWhatsapp(mensagem: string): string {
  return `${NUMEROZAP}?text=${encodeURIComponent(mensagem)}`
}
export const INSTAGRAM_URL = 'https://instagram.com/silvaniascacau'

export const ENDERECO = {
  rua: 'R. Sete de Setembro, 1978 - Setor 4',
  cidade: "Santa Luzia D'Oeste - RO",
  cep: 'CEP 76950-000',
  latitude: -11.911265741721149,
  longitude: -61.78445093828045,
} as const

export const MENSAGEM_ZAP_GERAL =
  'Olá! Vi o catálogo da Silvania\'s Cacau no site e gostaria de mais informações.'
