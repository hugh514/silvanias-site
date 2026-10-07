import { describe, expect, it } from 'vitest'

import { dimensoesAlvo } from '@/lib/upload/comprimir-imagem'

describe('dimensoesAlvo', () => {
  it('reduzir_paisagem_grande_mantemProporcao', () => {
    expect(dimensoesAlvo(4800, 3200)).toEqual({ largura: 2400, altura: 1600 })
  })

  it('reduzir_retratoGrande_limitaAltura', () => {
    expect(dimensoesAlvo(3000, 6000)).toEqual({ largura: 1200, altura: 2400 })
  })

  it('reduzir_imagemJaPequena_naoAumenta', () => {
    expect(dimensoesAlvo(800, 600)).toEqual({ largura: 800, altura: 600 })
  })

  it('reduzir_quadrada_usaLadoMaximo', () => {
    expect(dimensoesAlvo(4000, 4000, 1800)).toEqual({ largura: 1800, altura: 1800 })
  })
})
