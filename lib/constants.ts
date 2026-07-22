export const CATEGORIAS = ['Chocolate', 'Derivados do Cacau'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const NUMEROZAP = 'https://wa.me/5569984750156' as const
export type NumeroZap = typeof NUMEROZAP

export function gerarLinkWhatsapp(mensagem: string): string {
  return `${NUMEROZAP}?text=${encodeURIComponent(mensagem)}`
}