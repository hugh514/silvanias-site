export const CATEGORIAS = ['Chocolate', 'Derivados do Cacau'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const UNIDADES = [
  { value: 'peso', label: 'Peso' },
  { value: 'volume', label: 'Volume' },
  { value: 'unidade', label: 'Unidade' },
] as const
export type Unidade = (typeof UNIDADES)[number]['value']