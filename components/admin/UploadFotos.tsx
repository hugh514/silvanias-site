'use client'

import { useEffect, useRef, useState } from 'react'
import { Icone as Icon } from '@/components/ui/Icone'
import Image from 'next/image'

import { MAX_FOTOS } from '@/lib/schemas/produto'
import { comprimirImagem } from '@/lib/upload/comprimir-imagem'
import { TAMANHO_MAXIMO_BYTES, TIPOS_PERMITIDOS } from '@/lib/upload/validar-imagem'

export type FotoItem = {
  id: string
  preview: string
  arquivo?: File // presente só em fotos novas, ausente em fotos já salvas
  urlExistente?: string // presente só em fotos que já estão no Storage
}

type Props = {
  fotos: FotoItem[]
  onChange: (fotos: FotoItem[]) => void
}

const MAX_TAMANHO_MB = TAMANHO_MAXIMO_BYTES / 1024 / 1024
const formatarMB = (bytes: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)

export default function UploadFotos({ fotos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoItem | null>(null)

  // Substitui o alert() nativo, que bloqueava a página e era o único feedback de
  // erro deste componente. Princípio V da constituição.
  const [avisos, setAvisos] = useState<string[]>([])

  // Fotos acima do limite à espera da decisão da dona no modal.
  const [grandes, setGrandes] = useState<File[]>([])
  const [diminuindo, setDiminuindo] = useState(false)
  const [erroModal, setErroModal] = useState('')
  const botaoPrincipalRef = useRef<HTMLButtonElement>(null)
  const modalAberto = grandes.length > 0

  function fecharModal() {
    if (diminuindo) return
    setGrandes([])
    setErroModal('')
  }

  useEffect(() => {
    if (!modalAberto) return
    botaoPrincipalRef.current?.focus()
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !diminuindo) {
        setGrandes([])
        setErroModal('')
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [modalAberto, diminuindo])

  async function diminuirEUsar() {
    setDiminuindo(true)
    setErroModal('')
    try {
      const reduzidas = await Promise.all(
        grandes.map((g) => comprimirImagem(g, TAMANHO_MAXIMO_BYTES))
      )
      onChange([
        ...fotos,
        ...reduzidas.map((arquivo) => ({
          id: crypto.randomUUID(),
          preview: URL.createObjectURL(arquivo),
          arquivo,
        })),
      ])
      setGrandes([])
    } catch (e) {
      setErroModal(e instanceof Error ? e.message : 'Não foi possível diminuir a foto.')
    } finally {
      setDiminuindo(false)
    }
  }

  function handleArquivos(arquivos: FileList | null) {
    if (!arquivos) return

    const novasFotos: FotoItem[] = []
    const novosAvisos: string[] = []
    const espacoDisponivel = MAX_FOTOS - fotos.length
    const selecionados = Array.from(arquivos)
    const acimaDoLimite: File[] = []

    if (selecionados.length > espacoDisponivel) {
      novosAvisos.push(
        `São permitidas no máximo ${MAX_FOTOS} fotos. As demais foram ignoradas.`
      )
    }

    for (const arquivo of selecionados.slice(0, espacoDisponivel)) {
      // Verificação por conveniência: o servidor revalida pelos bytes reais do
      // ficheiro, porque o tipo declarado aqui é escolhido por quem envia.
      if (!TIPOS_PERMITIDOS.includes(arquivo.type as (typeof TIPOS_PERMITIDOS)[number])) {
        novosAvisos.push(`"${arquivo.name}" não é JPG, PNG, WebP ou AVIF e foi ignorado.`)
        continue
      }

      if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
        acimaDoLimite.push(arquivo)
        continue
      }

      novasFotos.push({
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(arquivo),
        arquivo,
      })
    }

    setAvisos(novosAvisos)
    if (novasFotos.length > 0) onChange([...fotos, ...novasFotos])
    if (acimaDoLimite.length > 0) {
      setErroModal('')
      setGrandes(acimaDoLimite)
    }

    // Permite reselecionar o mesmo ficheiro depois de o remover.
    if (inputRef.current) inputRef.current.value = ''
  }

  function removerFoto(id: string) {
    const alvo = fotos.find((f) => f.id === id)
    // Liberta a memória do preview local; sem isto o objeto fica retido.
    if (alvo?.arquivo) URL.revokeObjectURL(alvo.preview)

    setAvisos([])
    onChange(fotos.filter((f) => f.id !== id))
  }

  const podeAdicionar = fotos.length < MAX_FOTOS

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-marrom-escuro">Fotos do produto</span>

      {podeAdicionar && (
        <label
          className="flex flex-col items-center justify-center gap-2 bg-branco rounded-xl shadow-sm
                     border-2 border-dashed border-marrom-claro/40 py-10 cursor-pointer
                     hover:border-marrom-claro transition-colors"
        >
          <Icon icon="mdi:cloud-upload-outline" className="text-4xl text-marrom-claro" />
          <span className="text-sm text-preto text-center">
            Arraste ou clique para selecionar
          </span>
          <span className="text-xs text-cor-pele">
            JPG, PNG, WebP ou AVIF até {MAX_TAMANHO_MB} MB cada
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_PERMITIDOS.join(',')}
            multiple
            className="hidden"
            onChange={(e) => handleArquivos(e.target.files)}
          />
        </label>
      )}

      {avisos.length > 0 && (
        <ul className="flex flex-col gap-1" role="status" aria-live="polite">
          {avisos.map((aviso) => (
            <li key={aviso} className="text-xs text-red-600">
              {aviso}
            </li>
          ))}
        </ul>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-xl overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => setFotoAmpliada(foto)}
                className="relative block w-full h-full cursor-zoom-in"
                aria-label="Ampliar foto"
              >
                <Image
                  src={foto.preview}
                  alt="Foto do produto"
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                  unoptimized={!foto.urlExistente}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removerFoto(foto.id)
                }}
                className="absolute top-1.5 right-1.5 bg-branco rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                aria-label="Remover foto"
              >
                <Icon icon="mdi:close" className="text-sm text-preto" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualização ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-preto/80 flex items-center justify-center z-50 p-6"
          onClick={() => setFotoAmpliada(null)}
        >
          <button
            type="button"
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-5 right-5 bg-branco rounded-full w-9 h-9 flex items-center justify-center shadow-sm"
            aria-label="Fechar"
          >
            <Icon icon="mdi:close" className="text-xl text-preto" />
          </button>

          <div
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fotoAmpliada.preview}
              alt="Foto do produto ampliada"
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={!fotoAmpliada.urlExistente}
            />
          </div>
        </div>
      )}

      {/* Modal de foto acima do limite */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-preto/60 flex items-center justify-center z-50 p-6"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-foto-grande"
            className="bg-branco rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="titulo-foto-grande" className="text-preto font-medium">
              Foto muito grande
            </p>
            <p className="text-sm text-preto/50">
              {grandes.length === 1
                ? `A foto ${grandes[0].name} tem ${formatarMB(grandes[0].size)} MB. O limite é ${MAX_TAMANHO_MB} MB.`
                : `${grandes.length} fotos passam do limite de ${MAX_TAMANHO_MB} MB.`}
            </p>
            <p className="text-sm text-preto/50">Podemos diminuir automaticamente para você.</p>
            {erroModal && (
              <p className="text-xs text-red-600" role="alert">
                {erroModal}
              </p>
            )}

            <div className="flex gap-4 mt-6 w-full">
              <button
                type="button"
                onClick={fecharModal}
                disabled={diminuindo}
                className="flex-1 px-6 py-2.5 rounded-xl bg-branco-falso text-marrom-escuro font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                ref={botaoPrincipalRef}
                type="button"
                onClick={diminuirEUsar}
                disabled={diminuindo}
                className="flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl bg-marrom-escuro hover:bg-marrom text-branco font-medium transition-colors disabled:opacity-60"
              >
                {diminuindo ? 'Diminuindo...' : 'Diminuir e usar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
