import Link from 'next/link'
import Image from 'next/image'
import { Icone as Icon } from '@/components/ui/Icone'

import type { Produto as ProdutoCompleto } from '@/types/produto'
import Inclinavel from './Inclinavel'

type Produto = Pick<ProdutoCompleto, 'id' | 'nome' | 'categoria' | 'fotos'> & { destaque?: boolean }

export default function ProdutoCardVitrine({ produto }: { produto: Produto }) {
  const foto = produto.fotos?.[0]

  return (
    <Link href={`/produtos/${produto.id}`} className="group flex flex-col gap-3 h-full">
      <Inclinavel className="rounded-2xl">
      <div className="relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-branco-falso">
        {foto ? (
          <Image
            src={foto}
            alt={produto.nome}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cor-pele">
            <Icon icon="mdi:image-off-outline" className="text-3xl" aria-label="Sem foto" />
          </div>
        )}
        {produto.destaque && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amarelo px-2.5 py-1 text-xs font-medium text-marrom-escuro">
            <Icon icon="mdi:star" />
            Destaque
          </span>
        )}
      </div>
      </Inclinavel>

      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm md:text-base font-medium text-marrom-escuro leading-snug">{produto.nome}</h4>
        <Icon
          icon="mdi:arrow-top-right"
          className="text-marrom-escuro/40 text-lg shrink-0 transition-colors group-hover:text-marrom-escuro"
        />
      </div>
    </Link>
  )
}
