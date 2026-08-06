import Image from 'next/image'
import Link from 'next/link'

import type { Produto as ProdutoCompleto } from '@/types/produto'

type Produto = Pick<ProdutoCompleto, 'id' | 'nome' | 'categoria' | 'disponivel' | 'fotos'>

export default function ProdutoCard({ produto }: { produto: Produto }) {
  const foto = produto.fotos?.[0]

  return (
    <Link
      href={`/admin/produtos/${produto.id}`}
      className="bg-branco rounded-md shadow-sm overflow-hidden flex flex-col
                 transition-transform duration-200 md:hover:-translate-y-1"
    >
      <div className="relative w-full aspect-square bg-branco-falso">
        {foto ? (
          <Image
            src={foto}
            alt={produto.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cor-pele text-sm">
            Sem foto
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1">
        <span className="text-xs text-cor-pele">{produto.categoria}</span>
        <h3 className="font-medium text-preto truncate">{produto.nome}</h3>      

        <span
          className={`self-end mt-2 text-xs font-medium px-3 py-1 rounded-sm ${
            produto.disponivel
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {produto.disponivel ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
    </Link>
  )
}