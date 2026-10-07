'use server'

import { revalidatePath } from 'next/cache'

import { validarFormularioProduto, MAX_FOTOS, type CamposComErro } from '@/lib/schemas/produto'
import { createClient, verificarAdmin } from '@/lib/supabase/server'
import {
  derivarCaminhoStorage,
  gerarNomeArquivo,
  validarImagem,
} from '@/lib/upload/validar-imagem'

const BUCKET = 'produtos'

export type ResultadoAcao =
  | { ok: true }
  | { ok: false; erro: string; camposComErro?: CamposComErro }

/** Mensagem única para falhas técnicas. Nunca devolver texto da base de dados (FR-029). */
const ERRO_GENERICO = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Invariante partilhado: sessão → autorização.
 * Corre em TODAS as ações de escrita, mesmo quando as políticas de acesso já
 * restringiriam a operação. As duas camadas são independentes de propósito —
 * confiar apenas numa foi o que causou esta feature.
 */
async function exigirAdmin(): Promise<ResultadoAcao | null> {
  const auth = await verificarAdmin()
  if (auth.autorizado) return null

  return {
    ok: false,
    erro:
      auth.motivo === 'sem-sessao'
        ? 'Sua sessão expirou. Entre novamente para continuar.'
        : 'Você não tem permissão para alterar o catálogo.',
  }
}

function revalidarTudo(idProduto?: string) {
  revalidatePath('/admin/produtos')
  revalidatePath('/')
  if (idProduto) revalidatePath(`/produtos/${idProduto}`)
}

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>

/**
 * Envia as fotos novas e devolve os endereços públicos.
 *
 * Em caso de falha remove o que já tinha sido enviado NESTA operação, para não
 * deixar ficheiros órfãos a ocupar espaço sem produto associado — um dos casos
 * limite levantados na especificação.
 */
async function enviarFotos(
  supabase: SupabaseServidor,
  arquivos: File[]
): Promise<{ ok: true; urls: string[] } | { ok: false; erro: string }> {
  const caminhosEnviados: string[] = []
  const urls: string[] = []

  for (const arquivo of arquivos) {
    const bytes = new Uint8Array(await arquivo.arrayBuffer())
    const validacao = validarImagem(bytes, arquivo.size)

    if (!validacao.valido) {
      await limparCaminhos(supabase, caminhosEnviados)
      return { ok: false, erro: validacao.motivo }
    }

    // Nome gerado pelo sistema a partir do tipo DETETADO. O nome escolhido por
    // quem envia é descartado por completo.
    const caminho = gerarNomeArquivo(validacao.tipo)

    const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
      contentType: validacao.tipo,
      upsert: false,
    })

    if (error) {
      await limparCaminhos(supabase, caminhosEnviados)
      return { ok: false, erro: 'Não foi possível enviar uma das fotos. Tente novamente.' }
    }

    caminhosEnviados.push(caminho)
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl)
  }

  return { ok: true, urls }
}

async function limparCaminhos(supabase: SupabaseServidor, caminhos: string[]) {
  if (caminhos.length === 0) return
  await supabase.storage.from(BUCKET).remove(caminhos)
}

async function removerPorUrl(supabase: SupabaseServidor, urls: string[]) {
  const caminhos = urls
    .map((url) => derivarCaminhoStorage(url, BUCKET))
    .filter((c): c is string => c !== null)

  await limparCaminhos(supabase, caminhos)
}

/** Lê os ficheiros novos do formulário, ignorando entradas vazias. */
function extrairArquivos(formData: FormData): File[] {
  return formData
    .getAll('fotosNovas')
    .filter((f): f is File => f instanceof File && f.size > 0)
}

// -----------------------------------------------------------------------------
// Criar
// -----------------------------------------------------------------------------

export async function criarProduto(
  _estadoAnterior: ResultadoAcao | null,
  formData: FormData
): Promise<ResultadoAcao> {
  const negado = await exigirAdmin()
  if (negado) return negado

  const validacao = validarFormularioProduto(formData)
  if (!validacao.ok) {
    return { ok: false, erro: 'Verifique os campos destacados.', camposComErro: validacao.camposComErro }
  }

  const arquivos = extrairArquivos(formData)
  if (arquivos.length > MAX_FOTOS) {
    return { ok: false, erro: `São permitidas no máximo ${MAX_FOTOS} fotos.` }
  }

  const supabase = await createClient()

  const envio = await enviarFotos(supabase, arquivos)
  if (!envio.ok) return { ok: false, erro: envio.erro }

  const { dados } = validacao
  const { error } = await supabase.from('produtos').insert({
    nome: dados.nome,
    categoria: dados.categoria,
    descricao: dados.descricao,
    ingredientes: dados.ingredientes,
    disponivel: dados.disponivel,
    ordem: dados.ordem,
    destaque: dados.destaque,
    fotos: envio.urls,
  })

  if (error) {
    // A gravação falhou depois do envio: limpar para não deixar órfãos.
    await limparCaminhos(
      supabase,
      envio.urls.map((u) => derivarCaminhoStorage(u, BUCKET)).filter((c): c is string => c !== null)
    )
    console.error('[criarProduto]', error)
    return { ok: false, erro: ERRO_GENERICO }
  }

  revalidarTudo()
  return { ok: true }
}

// -----------------------------------------------------------------------------
// Atualizar
// -----------------------------------------------------------------------------

export async function atualizarProduto(
  id: string,
  _estadoAnterior: ResultadoAcao | null,
  formData: FormData
): Promise<ResultadoAcao> {
  const negado = await exigirAdmin()
  if (negado) return negado

  const validacao = validarFormularioProduto(formData)
  if (!validacao.ok) {
    return { ok: false, erro: 'Verifique os campos destacados.', camposComErro: validacao.camposComErro }
  }

  const supabase = await createClient()

  const { data: atual, error: erroLeitura } = await supabase
    .from('produtos')
    .select('fotos')
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) {
    console.error('[atualizarProduto:leitura]', erroLeitura)
    return { ok: false, erro: ERRO_GENERICO }
  }

  if (!atual) {
    // Caso limite: outra administradora removeu o produto entretanto.
    return { ok: false, erro: 'Este produto não existe mais. Ele pode ter sido excluído.' }
  }

  const { dados } = validacao
  const arquivos = extrairArquivos(formData)

  if (dados.fotosExistentes.length + arquivos.length > MAX_FOTOS) {
    return { ok: false, erro: `São permitidas no máximo ${MAX_FOTOS} fotos.` }
  }

  const envio = await enviarFotos(supabase, arquivos)
  if (!envio.ok) return { ok: false, erro: envio.erro }

  const fotosFinais = [...dados.fotosExistentes, ...envio.urls]

  const { error } = await supabase
    .from('produtos')
    .update({
      nome: dados.nome,
      categoria: dados.categoria,
      descricao: dados.descricao,
      ingredientes: dados.ingredientes,
      disponivel: dados.disponivel,
    ordem: dados.ordem,
    destaque: dados.destaque,
      fotos: fotosFinais,
    })
    .eq('id', id)

  if (error) {
    await limparCaminhos(
      supabase,
      envio.urls.map((u) => derivarCaminhoStorage(u, BUCKET)).filter((c): c is string => c !== null)
    )
    console.error('[atualizarProduto]', error)
    return { ok: false, erro: ERRO_GENERICO }
  }

  // As fotos retiradas só saem do armazenamento DEPOIS de a linha gravar com
  // sucesso. A ordem inversa deixaria o produto a apontar para ficheiros que já
  // não existem, caso a gravação falhasse.
  const removidas = (atual.fotos ?? []).filter((url) => !fotosFinais.includes(url))
  await removerPorUrl(supabase, removidas)

  revalidarTudo(id)
  return { ok: true }
}

// -----------------------------------------------------------------------------
// Remover
// -----------------------------------------------------------------------------

export async function removerProduto(id: string): Promise<ResultadoAcao> {
  const negado = await exigirAdmin()
  if (negado) return negado

  const supabase = await createClient()

  const { data: produto, error: erroLeitura } = await supabase
    .from('produtos')
    .select('fotos')
    .eq('id', id)
    .maybeSingle()

  if (erroLeitura) {
    console.error('[removerProduto:leitura]', erroLeitura)
    return { ok: false, erro: ERRO_GENERICO }
  }

  if (!produto) {
    return { ok: false, erro: 'Este produto não existe mais. Ele pode já ter sido excluído.' }
  }

  // Ficheiros primeiro, linha depois. Se a remoção da linha falhar a seguir,
  // ficam ficheiros em falta para um produto que ainda existe — visível e
  // corrigível. A ordem inversa deixaria órfãos invisíveis.
  await removerPorUrl(supabase, produto.fotos ?? [])

  const { error } = await supabase.from('produtos').delete().eq('id', id)

  if (error) {
    console.error('[removerProduto]', error)
    return { ok: false, erro: ERRO_GENERICO }
  }

  revalidarTudo(id)
  return { ok: true }
}
