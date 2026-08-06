/**
 * Validação de imagens carregadas — funções puras, sem rede nem base de dados.
 *
 * Estado antes de 2026-07-25: o contentor aceitava qualquer ficheiro de qualquer
 * tamanho, e o nome de gravação era `{uuid}-{nome escolhido por quem envia}`.
 * O `accept="image/*"` do formulário é apenas sugestão ao seletor de ficheiros do
 * navegador — não impede coisa nenhuma a quem chame a interface diretamente.
 *
 * Aqui o tipo é determinado pelos BYTES do ficheiro, não pela extensão nem pelo
 * tipo declarado. Ambos são escolhidos por quem envia e portanto não merecem
 * confiança.
 */

export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024 // 5 MB, alinhado com o limite do contentor

/** Formatos aceites. SVG está deliberadamente fora: ver nota no fim do ficheiro. */
export const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type TipoImagem = (typeof TIPOS_PERMITIDOS)[number]

const EXTENSAO_POR_TIPO: Record<TipoImagem, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function comecaCom(bytes: Uint8Array, assinatura: number[], deslocamento = 0): boolean {
  if (bytes.length < deslocamento + assinatura.length) return false
  return assinatura.every((b, i) => bytes[deslocamento + i] === b)
}

/**
 * Determina o tipo real pela assinatura de conteúdo. Devolve `null` se não
 * corresponder a nenhum formato aceite.
 *
 * Deteção própria em vez de biblioteca genérica: são quatro formatos com
 * assinaturas curtas e estáveis. Uma biblioteca traria centenas de formatos que
 * não queremos aceitar — mais superfície, nenhum ganho.
 */
export function detetarTipoReal(bytes: Uint8Array): TipoImagem | null {
  // JPEG — FF D8 FF
  if (comecaCom(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'

  // WebP — "RIFF" nos bytes 0-3 e "WEBP" nos bytes 8-11
  if (
    comecaCom(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    comecaCom(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp'
  }

  // AVIF — "ftyp" nos bytes 4-7, seguido da marca "avif" ou "avis"
  if (comecaCom(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const marca = String.fromCharCode(...Array.from(bytes.slice(8, 12)))
    if (marca === 'avif' || marca === 'avis') return 'image/avif'
  }

  return null
}

export type ResultadoValidacao =
  | { valido: true; tipo: TipoImagem }
  | { valido: false; motivo: string }

/**
 * Valida tamanho e tipo real. Mensagem de recusa em português, pronta a mostrar.
 */
export function validarImagem(bytes: Uint8Array, tamanhoBytes: number): ResultadoValidacao {
  if (tamanhoBytes === 0) {
    return { valido: false, motivo: 'O arquivo está vazio.' }
  }

  if (tamanhoBytes > TAMANHO_MAXIMO_BYTES) {
    const mb = (tamanhoBytes / 1024 / 1024).toFixed(1)
    return {
      valido: false,
      motivo: `A imagem tem ${mb} MB e o limite é de 5 MB.`,
    }
  }

  const tipo = detetarTipoReal(bytes)

  if (!tipo) {
    return {
      valido: false,
      motivo: 'O arquivo não é uma imagem válida. Envie JPG, PNG, WebP ou AVIF.',
    }
  }

  return { valido: true, tipo }
}

/**
 * Gera o nome de gravação a partir do tipo DETETADO, descartando por completo o
 * nome recebido.
 *
 * Resolve de uma vez: percurso entre pastas, colisão de nomes, caracteres
 * problemáticos, e a discrepância entre extensão declarada e conteúdo real.
 * O nome deixa de ser entrada de confiança porque deixa de ser usado.
 */
export function gerarNomeArquivo(tipo: TipoImagem): string {
  return `${crypto.randomUUID()}.${EXTENSAO_POR_TIPO[tipo]}`
}

/** Prefixo completo de um endereço público de armazenamento do Supabase. */
const PREFIXO_STORAGE = '/storage/v1/object/public/'

/**
 * Extrai o caminho dentro do contentor a partir de um endereço público.
 *
 * O código anterior fazia `url.split('/produtos/').pop()`, que parte se o nome do
 * ficheiro contiver `/produtos/` — e deixaria ficheiros órfãos por remover.
 * Recortar pelo prefixo COMPLETO elimina a ambiguidade: um nome de ficheiro não
 * pode conter `/storage/v1/object/public/`.
 */
export function derivarCaminhoStorage(
  urlPublica: string,
  bucket: string
): string | null {
  const marcador = `${PREFIXO_STORAGE}${bucket}/`
  const i = urlPublica.indexOf(marcador)
  if (i === -1) return null

  const caminho = urlPublica.slice(i + marcador.length)
  if (!caminho) return null

  try {
    return decodeURIComponent(caminho)
  } catch {
    // Sequência de escape inválida no endereço — devolver o caminho cru é
    // preferível a rebentar durante uma remoção.
    return caminho
  }
}

/*
 * Porque é que SVG não entra:
 * um SVG é um documento que pode conter script. Servido a partir de um contentor
 * público no domínio da marca, torna-se um vetor de execução de código com essa
 * origem. Não é formato de foto de produto e não há motivo para o aceitar.
 */
