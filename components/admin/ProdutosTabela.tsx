'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Icone as Icon } from '@/components/ui/Icone'
import type { Produto as ProdutoCompleto } from '@/types/produto'

type Produto = Pick<ProdutoCompleto, 'id' | 'nome' | 'categoria' | 'disponivel' | 'fotos' | 'ordem' | 'destaque'>
type Filtro = 'todos' | 'sim' | 'nao'

const ITENS_POR_PAGINA = 20

/** Remove acentos e caixa: "chocolate" encontra "Chocolate", "cupuacu" encontra "Cupuaçu". */
const normalizar = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function ProdutosTabela({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return produtos.filter(
      (p) =>
        normalizar(p.nome).includes(termo) &&
        (filtro === 'todos' || (filtro === 'sim') === !!p.disponivel)
    )
  }, [produtos, busca, filtro])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  const daPagina = filtrados.slice((atual - 1) * ITENS_POR_PAGINA, atual * ITENS_POR_PAGINA)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex items-center gap-2 bg-branco rounded-xl px-4 h-11 flex-1 shadow-sm">
          <Icon icon="mdi:magnify" className="text-cor-pele text-xl shrink-0" />
          <span className="sr-only">Pesquisar produto</span>
          <input
            type="search"
            placeholder="Pesquisar pelo nome"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            className="flex-1 bg-transparent outline-none text-sm text-preto placeholder:text-cor-pele min-w-0"
          />
        </label>

        <label className="flex items-center gap-2 bg-branco rounded-xl px-4 h-11 shadow-sm text-sm text-marrom-escuro">
          <span className="sr-only sm:not-sr-only">Mostrar</span>
          <select
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value as Filtro)
              setPagina(1)
            }}
            className="bg-transparent outline-none cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="sim">Disponíveis</option>
            <option value="nao">Indisponíveis</option>
          </select>
        </label>
      </div>

      <div className="bg-branco rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-marrom-escuro/60 border-b border-marrom-escuro/10">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell text-center">Ordem</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marrom-escuro/5">
            {daPagina.map((p) => (
              <tr key={p.id} className="hover:bg-branco-falso/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 min-w-0">
                    <span className="relative w-12 h-12 rounded-lg overflow-hidden bg-branco-falso shrink-0">
                      {p.fotos?.[0] && <Image src={p.fotos[0]} alt="" fill sizes="48px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium text-marrom-escuro truncate">
                        {p.nome}
                        {p.destaque && (
                          <Icon icon="mdi:star" className="text-amarelo shrink-0" aria-label="Em destaque" />
                        )}
                      </span>
                      <span className="block md:hidden text-xs text-marrom-escuro/60">{p.categoria}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-marrom-escuro/80">{p.categoria}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-center tabular-nums text-marrom-escuro/80">
                  {p.ordem}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.disponivel ? 'Na vitrine' : 'Oculto'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    aria-label={`Editar ${p.nome}`}
                    className="inline-flex w-9 h-9 items-center justify-center rounded-full text-marrom-escuro hover:bg-branco-falso"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-lg" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daPagina.length === 0 && (
          <p className="text-center text-cor-pele py-12 text-sm">Nenhum produto encontrado.</p>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPagina(atual - 1)}
            disabled={atual === 1}
            className="text-marrom-escuro disabled:opacity-30"
            aria-label="Página anterior"
          >
            <Icon icon="mdi:chevron-left" className="text-2xl" />
          </button>
          <span className="text-sm text-marrom-escuro">
            {atual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina(atual + 1)}
            disabled={atual === totalPaginas}
            className="text-marrom-escuro disabled:opacity-30"
            aria-label="Próxima página"
          >
            <Icon icon="mdi:chevron-right" className="text-2xl" />
          </button>
        </div>
      )}
    </div>
  )
}
