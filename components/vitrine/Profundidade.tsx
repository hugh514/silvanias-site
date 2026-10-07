'use client'

import { useEffect, useRef } from 'react'

/**
 * Palco com profundidade: publica `--px` e `--py` (-1…1) no próprio elemento,
 * seguindo o rato (ou a rolagem, em ecrã tátil). As camadas filhas usam esses
 * valores em CSS (`.camada`, ver globals.css) — o React não re-renderiza nada.
 *
 * Com "reduzir movimento" ligado não regista nenhum ouvinte: fica tudo parado.
 */
export default function Profundidade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let alvoX = 0
    let alvoY = 0
    let x = 0
    let y = 0
    let quadro = 0
    const limitar = (v: number) => Math.max(-1, Math.min(1, v))

    // Aproximação suave ao alvo: o movimento acompanha a mão sem tremer.
    const animar = () => {
      x += (alvoX - x) * 0.08
      y += (alvoY - y) * 0.08
      el.style.setProperty('--px', x.toFixed(3))
      el.style.setProperty('--py', y.toFixed(3))
      quadro = Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.002 ? requestAnimationFrame(animar) : 0
    }
    const pedir = () => {
      if (!quadro) quadro = requestAnimationFrame(animar)
    }

    const aoMover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      alvoX = limitar(((e.clientX - r.left) / r.width - 0.5) * 2)
      alvoY = limitar(((e.clientY - r.top) / r.height - 0.5) * 2)
      pedir()
    }
    const aoRolar = () => {
      const r = el.getBoundingClientRect()
      alvoY = limitar(((r.top + r.height / 2) / innerHeight - 0.5) * 2)
      pedir()
    }

    const ratoFino = matchMedia('(hover: hover) and (pointer: fine)').matches
    if (ratoFino) window.addEventListener('pointermove', aoMover, { passive: true })
    else {
      window.addEventListener('scroll', aoRolar, { passive: true })
      aoRolar()
    }

    return () => {
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(quadro)
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
