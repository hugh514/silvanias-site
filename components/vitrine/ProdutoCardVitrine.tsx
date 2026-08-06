import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'

import type { Produto as ProdutoCompleto } from '@/types/produto'

type Produto = Pick<ProdutoCompleto, 'id' | 'nome' | 'categoria' | 'fotos'>

export default function ProdutoCardVitrine({ produto }: { produto: Produto }) {
  const fotoPrincipal = produto.fotos?.[0]
  const fotoHover = produto.fotos?.[1] ?? fotoPrincipal

  return (
    <Link
      href={`/produtos/${produto.id}`}
      draggable={false}
      className="group shrink-0 w-47.5 sm:w-55 md:w-65 bg-branco rounded-2xl
                 shadow-[0_8px_24px_-8px_rgba(53,21,3,0.25)]
                 p-3 flex flex-col gap-3 transition-all duration-200
                 md:hover:-translate-y-1.5 md:hover:shadow-[0_12px_28px_-8px_rgba(53,21,3,0.32)]
                 select-none"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-branco-falso">
        {fotoPrincipal ? (
          <>
            <Image
              src={fotoPrincipal}
              alt={produto.nome}
              fill
              draggable={false}
              className="object-cover transition-opacity duration-300 md:group-hover:opacity-0"
            />
            {fotoHover && (
              <Image
                src={fotoHover}
                alt={produto.nome}
                fill
                draggable={false}
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-300 md:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cor-pele text-xs">
            Sem foto
          </div>
        )}
      </div>

      <div>
        <span className="text-xs text-cor-pele">{produto.categoria}</span>
        <h4 className="text-sm font-medium text-marrom-escuro leading-snug">
          {produto.nome}
        </h4>
      </div>

      <div className="flex items-center justify-end">
        <span className="w-9 h-9 rounded-full bg-marrom-claro/30 flex items-center justify-center">
          <Icon icon="mdi:plus" className="text-marrom-escuro text-lg" />
        </span>
      </div>
    </Link>
  )
}