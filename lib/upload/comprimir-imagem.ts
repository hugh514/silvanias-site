/**
 * Redução automática de fotos grandes, feita no navegador antes do envio.
 * Só `dimensoesAlvo` é pura; `comprimirImagem` precisa de canvas.
 */

const LADOS_MAXIMOS = [2400, 1800, 1400]
const QUALIDADES = [0.85, 0.75, 0.65, 0.55]

/** Mantém a proporção e nunca aumenta a imagem. */
export function dimensoesAlvo(
  largura: number,
  altura: number,
  ladoMaximo = 2400
): { largura: number; altura: number } {
  const maior = Math.max(largura, altura)
  if (maior <= ladoMaximo) return { largura, altura }

  const escala = ladoMaximo / maior
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  }
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade))
}

export async function comprimirImagem(arquivo: File, limiteBytes: number): Promise<File> {
  const erro = new Error('Não foi possível diminuir esta foto. Tente escolher outra.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(arquivo)
  } catch {
    throw erro
  }

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw erro

    const base = arquivo.name.replace(/\.[^.]+$/, '')

    for (const lado of LADOS_MAXIMOS) {
      const { largura, altura } = dimensoesAlvo(bitmap.width, bitmap.height, lado)
      canvas.width = largura
      canvas.height = altura
      ctx.clearRect(0, 0, largura, altura)
      ctx.drawImage(bitmap, 0, 0, largura, altura)

      for (const qualidade of QUALIDADES) {
        let blob = await paraBlob(canvas, 'image/webp', qualidade)
        // Navegador sem suporte a WebP devolve PNG: cai para JPEG.
        if (!blob || blob.type !== 'image/webp') blob = await paraBlob(canvas, 'image/jpeg', qualidade)
        if (!blob) throw erro

        if (blob.size <= limiteBytes) {
          const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
          return new File([blob], `${base}.${ext}`, { type: blob.type })
        }
      }
    }
  } finally {
    bitmap.close()
  }

  throw new Error('Não foi possível diminuir esta foto o bastante. Tente escolher outra.')
}
