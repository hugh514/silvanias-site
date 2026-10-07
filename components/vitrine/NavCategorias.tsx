'use client'

import { useEffect, useRef, useState } from 'react'

export type ItemCategoria = { id: string; nome: string; total: number }

/**
 * Barra de categorias presa ao topo enquanto o catálogo está na tela.
 * Marca sozinha a categoria visível (scroll-spy) e, no celular, centraliza o
 * botão ativo. Os links são âncoras normais: funcionam mesmo sem JavaScript.
 */
export default function NavCategorias({ categorias }: { categorias: ItemCategoria[] }) {
  const [ativa, setAtiva] = useState(categorias[0]?.id)
  const trilho = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const secoes = categorias
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null)

    // A categoria ativa é a que ocupa a faixa logo abaixo da barra.
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-140px 0px -55% 0px' }
    )
    secoes.forEach((s) => observador.observe(s))
    return () => observador.disconnect()
  }, [categorias])

  useEffect(() => {
    const botao = trilho.current?.querySelector<HTMLElement>(`[data-id="${ativa}"]`)
    const t = trilho.current
    if (!botao || !t) return
    t.scrollTo({ left: botao.offsetLeft - (t.clientWidth - botao.offsetWidth) / 2, behavior: 'smooth' })
  }, [ativa])

  if (categorias.length < 2) return null

  return (
    <nav
      aria-label="Categorias do catálogo"
      className="sticky top-16 z-30 -mx-6 px-6 py-3 mb-8 bg-branco/90 backdrop-blur border-b border-marrom-escuro/10"
    >
      <div ref={trilho} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categorias.map((c) => {
          const marcada = c.id === ativa
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-id={c.id}
              aria-current={marcada ? 'true' : undefined}
              onClick={() => setAtiva(c.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                marcada
                  ? 'bg-marrom-escuro text-branco'
                  : 'bg-branco-falso text-marrom-escuro hover:bg-marrom-claro/25'
              }`}
            >
              {c.nome}
              <span className={`text-xs tabular-nums ${marcada ? 'text-branco/70' : 'text-marrom-escuro/50'}`}>
                {c.total}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
