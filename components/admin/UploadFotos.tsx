'use client'

import { useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'

const MAX_FOTOS = 4
const MAX_TAMANHO_MB = 5

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

export default function UploadFotos({ fotos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoItem | null>(null)

  function handleArquivos(arquivos: FileList | null) {
    if (!arquivos) return

    const novasFotos: FotoItem[] = []
    const espacoDisponivel = MAX_FOTOS - fotos.length

    for (const arquivo of Array.from(arquivos).slice(0, espacoDisponivel)) {
      if (arquivo.size > MAX_TAMANHO_MB * 1024 * 1024) {
        alert(`"${arquivo.name}" excede ${MAX_TAMANHO_MB}MB e foi ignorado.`)
        continue
      }
      novasFotos.push({
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(arquivo),
        arquivo,
      })
    }

    onChange([...fotos, ...novasFotos])
  }

  function removerFoto(id: string) {
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
            PNG, JPG até {MAX_TAMANHO_MB}MB cada
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => handleArquivos(e.target.files)}
          />
        </label>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setFotoAmpliada(foto)}
                className="w-full h-full cursor-zoom-in"
                aria-label="Ampliar foto"
              >
                <Image src={foto.preview} alt="Foto do produto" fill className="object-cover" />
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
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}