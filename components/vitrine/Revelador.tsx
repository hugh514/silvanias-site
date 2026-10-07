'use client'

import { useEffect } from 'react'

/**
 * Entrada ao rolar para tudo o que tiver `data-revelar`.
 *
 * Funciona em qualquer navegador (IntersectionObserver). Sem JavaScript, ou com
 * "reduzir movimento", nada é escondido: a classe `js-revelar` só entra no
 * <html> depois de marcar como visível o que já está na tela — sem piscar.
 * Irmãos na mesma grelha entram em cascata (`--i` = posição na linha).
 */
export default function Revelador() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const alvos = [...document.querySelectorAll<HTMLElement>('[data-revelar]')]
    for (const el of alvos) {
      const irmaos = [...(el.parentElement?.children ?? [])].filter((c) => c.hasAttribute('data-revelar'))
      el.style.setProperty('--i', String(irmaos.indexOf(el) % 4))
      const r = el.getBoundingClientRect()
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('visivel')
    }
    document.documentElement.classList.add('js-revelar')

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.classList.add('visivel')
          observador.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    )
    alvos.filter((el) => !el.classList.contains('visivel')).forEach((el) => observador.observe(el))

    return () => observador.disconnect()
  }, [])

  return null
}
