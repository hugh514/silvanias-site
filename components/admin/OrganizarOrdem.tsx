'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Icone as Icon } from '@/components/ui/Icone'
import { reordenarProdutos } from '@/lib/actions/produtos'
import { CATEGORIAS } from '@/lib/constants'
import type { Produto as ProdutoCompleto } from '@/types/produto'

type Produto = Pick<ProdutoCompleto, 'id' | 'nome' | 'categoria' | 'disponivel' | 'fotos' | 'destaque'>

/**
 * Organizar a ordem do catálogo: os produtos aparecem agrupados por categoria,
 * como na vitrine. Arrastar pela alça (computador) ou usar as setas (celular e
 * teclado). Nada é gravado até "Salvar ordem".
 */
export default function OrganizarOrdem({ produtos, aoFechar }: { produtos: Produto[]; aoFechar: () => void }) {
  const router = useRouter()
  const [grupos, setGrupos] = useState(() =>
    CATEGORIAS.map((categoria) => ({ categoria, itens: produtos.filter((p) => p.categoria === categoria) })).filter(
      (g) => g.itens.length > 0
    )
  )
  const [arrastado, setArrastado] = useState<{ grupo: number; indice: number } | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, iniciar] = useTransition()

  function mover(grupo: number, de: number, para: number) {
    setGrupos((atual) =>
      atual.map((g, gi) => {
        if (gi !== grupo || para < 0 || para >= g.itens.length || de === para) return g
        const itens = [...g.itens]
        const [item] = itens.splice(de, 1)
        itens.splice(para, 0, item)
        return { ...g, itens }
      })
    )
  }

  function salvar() {
    setErro('')
    iniciar(async () => {
      const r = await reordenarProdutos(grupos.flatMap((g) => g.itens.map((p) => p.id)))
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      router.push('/admin/produtos?aviso=ordem')
      router.refresh()
      aoFechar()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-branco p-4 text-sm text-marrom-escuro/80 flex items-start gap-3 shadow-sm">
        <Icon icon="mdi:drag" className="text-xl text-cor-pele shrink-0" />
        <p>
          Arraste pela alça ou use as setas. O primeiro de cada categoria é o primeiro a aparecer no site. A ordem só
          muda depois de <strong>Salvar ordem</strong>.
        </p>
      </div>

      {grupos.map((g, gi) => (
        <section key={g.categoria} className="flex flex-col gap-2">
          <h2 className="font-titulo text-xl text-marrom-escuro">{g.categoria}</h2>
          <ol className="flex flex-col gap-2">
            {g.itens.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => setArrastado({ grupo: gi, indice: i })}
                onDragEnd={() => setArrastado(null)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (arrastado && arrastado.grupo === gi && arrastado.indice !== i) {
                    mover(gi, arrastado.indice, i)
                    setArrastado({ grupo: gi, indice: i })
                  }
                }}
                className={`flex items-center gap-3 rounded-xl bg-branco px-3 py-2 shadow-sm transition-opacity ${
                  arrastado?.grupo === gi && arrastado.indice === i ? 'opacity-50 ring-2 ring-marrom-claro' : ''
                }`}
              >
                <Icon icon="mdi:drag" className="text-2xl text-marrom-escuro/40 cursor-grab shrink-0" aria-hidden="true" />
                <span className="w-6 text-right text-sm tabular-nums text-marrom-escuro/50">{i + 1}</span>
                <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-branco-falso shrink-0">
                  {p.fotos?.[0] && <Image src={p.fotos[0]} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm font-medium text-marrom-escuro">
                  {p.nome}
                  {!p.disponivel && <span className="ml-2 text-xs font-normal text-red-700">oculto</span>}
                </span>
                <button
                  type="button"
                  onClick={() => mover(gi, i, i - 1)}
                  disabled={i === 0 || salvando}
                  aria-label={`Subir ${p.nome}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-marrom-escuro hover:bg-branco-falso disabled:opacity-25"
                >
                  <Icon icon="mdi:arrow-up" className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(gi, i, i + 1)}
                  disabled={i === g.itens.length - 1 || salvando}
                  aria-label={`Descer ${p.nome}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-marrom-escuro hover:bg-branco-falso disabled:opacity-25"
                >
                  <Icon icon="mdi:arrow-down" className="text-lg" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 md:-mx-10 px-4 md:px-10 py-4 flex justify-end gap-3 bg-branco-falso/90 backdrop-blur border-t border-marrom-escuro/10">
        <button
          type="button"
          onClick={aoFechar}
          disabled={salvando}
          className="px-6 h-11 rounded-full bg-branco shadow-sm text-marrom-escuro text-sm font-medium disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="px-6 h-11 rounded-full bg-marrom-escuro hover:bg-marrom text-branco text-sm font-medium shadow-sm disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar ordem'}
        </button>
      </div>
    </div>
  )
}
