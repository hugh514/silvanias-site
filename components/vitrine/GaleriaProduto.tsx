'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

import { Icone as Icon } from '@/components/ui/Icone'

type Props = {
  fotos: string[]
  nome: string
}

const LIMIAR_ARRASTE = 40

export default function GaleriaProduto({ fotos, nome }: Props) {
  const [atual, setAtual] = useState(0)
  const inicioX = useRef<number | null>(null)
  const total = fotos.length

  if (total === 0) {
    return (
      <div className="w-full aspect-4/5 bg-branco rounded-3xl flex items-center justify-center text-cor-pele">
        <Icon icon="mdi:image-off-outline" className="text-4xl" aria-label="Sem foto" />
      </div>
    )
  }

  const irPara = (i: number) => setAtual((i + total) % total)

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full aspect-4/5 bg-branco rounded-3xl overflow-hidden touch-pan-y"
        onPointerDown={(e) => (inicioX.current = e.clientX)}
        onPointerUp={(e) => {
          if (inicioX.current === null) return
          const delta = e.clientX - inicioX.current
          inicioX.current = null
          if (delta > LIMIAR_ARRASTE) irPara(atual - 1)
          else if (delta < -LIMIAR_ARRASTE) irPara(atual + 1)
        }}
      >
        <Image
          src={fotos[atual]}
          alt={`${nome} — foto ${atual + 1} de ${total}`}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover select-none pointer-events-none"
          draggable={false}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => irPara(atual - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-branco/85 hover:bg-branco flex items-center justify-center text-marrom-escuro shadow"
            >
              <Icon icon="mdi:chevron-left" className="text-2xl" />
            </button>
            <button
              type="button"
              onClick={() => irPara(atual + 1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-branco/85 hover:bg-branco flex items-center justify-center text-marrom-escuro shadow"
            >
              <Icon icon="mdi:chevron-right" className="text-2xl" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-3">
          {fotos.map((foto, i) => (
            <button
              key={foto + i}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === atual}
              className={`relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden shrink-0 ring-2 transition ${
                i === atual ? 'ring-marrom-escuro' : 'ring-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={foto} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
