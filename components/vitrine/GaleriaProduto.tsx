'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  fotos: string[]
  nome: string
}

const INTERVALO_AUTOPLAY = 5000

export default function GaleriaProduto({ fotos, nome }: Props) {
  const [indiceAtual, setIndiceAtual] = useState(0)
  const arrastando = useRef(false)
  const inicioX = useRef(0)

  const temFotos = fotos.length > 0
  const totalFotos = fotos.length

  // Auto-play — reinicia o timer sempre que o índice muda (manual ou automático)
  useEffect(() => {
    if (totalFotos <= 1) return
    const timer = setInterval(() => {
      setIndiceAtual((i) => (i + 1) % totalFotos)
    }, INTERVALO_AUTOPLAY)
    return () => clearInterval(timer)
  }, [indiceAtual, totalFotos])

  function irPara(indice: number) {
    setIndiceAtual(indice)
  }

  function proxima() {
    setIndiceAtual((i) => (i + 1) % totalFotos)
  }

  function anterior() {
    setIndiceAtual((i) => (i - 1 + totalFotos) % totalFotos)
  }

  function onPointerDown(e: React.PointerEvent) {
    arrastando.current = true
    inicioX.current = e.clientX
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!arrastando.current) return
    arrastando.current = false
    const delta = e.clientX - inicioX.current
    const LIMIAR = 40 // pixels mínimos para considerar um arraste válido

    if (delta > LIMIAR) anterior()
    else if (delta < -LIMIAR) proxima()
  }

  if (!temFotos) {
    return (
      <div className="w-full aspect-square bg-branco rounded-2xl shadow-sm flex items-center justify-center text-cor-pele">
        Sem foto
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop: destaque + miniaturas clicáveis */}
      <div className="hidden md:block">
        <div className="relative w-full aspect-square bg-branco rounded-2xl shadow-sm overflow-hidden">
          <Image
            src={fotos[indiceAtual]}
            alt={nome}
            fill
            className="object-contain p-6"
            priority
          />
        </div>

        {totalFotos > 1 && (
          <div className="flex gap-3 mt-4">
            {fotos.map((foto, i) =>
              i === indiceAtual ? null : (
                <button
                  key={foto + i}
                  type="button"
                  onClick={() => irPara(i)}
                  className="relative w-20 h-20 bg-branco rounded-xl shadow-sm overflow-hidden shrink-0
                             ring-1 ring-transparent hover:ring-marrom-claro transition-all"
                >
                  <Image src={foto} alt={nome} fill className="object-contain p-2" />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Mobile: destaque com drag + dots */}
      <div className="md:hidden">
        <div
          className="relative w-full aspect-square bg-branco rounded-2xl shadow-sm overflow-hidden touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <Image
            src={fotos[indiceAtual]}
            alt={nome}
            fill
            className="object-contain p-6 pointer-events-none select-none"
            draggable={false}
            priority
          />
        </div>

        {totalFotos > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {fotos.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === indiceAtual ? 'bg-marrom-escuro' : 'bg-marrom-claro/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}