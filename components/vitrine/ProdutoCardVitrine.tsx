import Image from 'next/image'
import { Icon } from '@iconify/react'
import Link from 'next/link'

type Produto = {
  id: string
  nome: string
  categoria: string
  fotos: string[] | null
}

export default function ProdutoCardVitrine({ produto }: { produto: Produto }) {
  const fotoPrincipal = produto.fotos?.[0]
  const fotoHover = produto.fotos?.[1] ?? fotoPrincipal

  return (
   <div
  className="group shrink-0 w-47.5 sm:w-55 md:w-65 bg-branco rounded-2xl
             shadow-[0_4px_16px_rgba(53,21,3,0.2)]
             p-3 flex flex-col gap-3 transition-all duration-200
             md:hover:-translate-y-1.5 md:shadow-[0_4px_16px_rgba(53,21,3,0.25)]
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
        <Link
          type="button"
          className="w-9 h-9 rounded-full bg-marrom-claro/30 hover:bg-marrom-claro/50 flex items-center justify-center transition-colors"
          aria-label="Ver produto"
          href={`/produtos/${produto.id}`}
        >
          <Icon icon="mdi:plus" className="text-marrom-escuro text-lg" />
        </Link>
      </div>
    </div>
  )
}