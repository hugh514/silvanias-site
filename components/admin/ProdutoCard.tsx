import Image from 'next/image'
import Link from 'next/link'

type Produto = {
  id: string
  nome: string
  categoria: string
  preco_unidade: number | null
  unidade: string | null
  disponivel: boolean
  fotos: string[] | null
}

export default function ProdutoCard({ produto }: { produto: Produto }) {
  const foto = produto.fotos?.[0]

  return (
    <Link
      href={`/admin/produtos/${produto.id}`}
      className="bg-branco rounded-xl shadow-sm overflow-hidden flex flex-col
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
        <p className="text-sm text-marrom-escuro">
          {produto.preco_unidade
            ? `R$ ${produto.preco_unidade.toFixed(2).replace('.', ',')}`
            : 'R$ 0,00'}
        </p>

        <span
          className={`self-start mt-2 text-xs font-medium px-3 py-1 rounded-full ${
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