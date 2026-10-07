'use client'

import { useRef } from 'react'

const GRAUS = 8

/**
 * Inclina o conteúdo na direção do cursor, com um reflexo que segue o rato —
 * como uma barra de chocolate a apanhar a luz. Só em rato/trackpad e sem
 * "reduzir movimento"; em ecrã tátil fica parado.
 */
export default function Inclinavel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const ativo = () =>
    matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      ref={ref}
      className={`inclinavel ${className}`}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el || !ativo()) return
        const r = el.getBoundingClientRect()
        const fx = (e.clientX - r.left) / r.width
        const fy = (e.clientY - r.top) / r.height
        el.style.setProperty('--ry', `${((fx - 0.5) * 2 * GRAUS).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${((0.5 - fy) * 2 * GRAUS).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(fx * 100).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(fy * 100).toFixed(1)}%`)
      }}
      onPointerLeave={() => {
        const el = ref.current
        el?.style.setProperty('--rx', '0deg')
        el?.style.setProperty('--ry', '0deg')
      }}
    >
      {children}
    </div>
  )
}
