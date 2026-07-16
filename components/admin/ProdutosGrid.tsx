'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import ProdutoCard from './ProdutoCard'

type Produto = {
  id: string
  nome: string
  categoria: string
  preco_unidade: number | null
  unidade: string | null
  disponivel: boolean
  fotos: string[] | null
}

const ITENS_POR_PAGINA = 15

export default function ProdutosGrid({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState('')
  const [filtroDisponivel, setFiltroDisponivel] = useState<'todos' | 'sim' | 'nao'>('todos')
  const [pagina, setPagina] = useState(1)

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
      const bateFiltro =
        filtroDisponivel === 'todos' ||
        (filtroDisponivel === 'sim' && p.disponivel) ||
        (filtroDisponivel === 'nao' && !p.disponivel)
      return bateBusca && bateFiltro
    })
  }, [produtos, busca, filtroDisponivel])

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)

  const produtosDaPagina = produtosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  function atualizarBusca(valor: string) {
    setBusca(valor)
    setPagina(1)
  }

  function atualizarFiltro(valor: 'todos' | 'sim' | 'nao') {
    setFiltroDisponivel(valor)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-6">
{/* Barra de busca, filtro e cadastro */}
<div
  className="flex flex-col lg:flex-row gap-4 lg:items-end"
  style={{ ['--campo-altura' as string]: 'clamp(3.25rem, 5vw, 3.75rem)' }}
>
  {/* Busca */}
  <div className="flex flex-col flex-1">
    <span className="hidden lg:block text-[11px] mb-1 invisible select-none">
      Disponível
    </span>
    <label
      className="flex items-center gap-3 bg-branco rounded-xl px-4 shadow-sm w-full shrink-0"
      style={{ height: 'var(--campo-altura)' }}
    >
      <Icon icon="mdi:magnify" className="text-cor-pele text-2xl shrink-0" />
      <input
        type="text"
        placeholder="Pesquisar"
        value={busca}
        onChange={(e) => atualizarBusca(e.target.value)}
        className="flex-1 bg-transparent outline-none text-preto placeholder:text-cor-pele min-w-0"
      />
    </label>
  </div>

  {/* Filtro + Botão */}
  <div className="flex flex-row gap-4 lg:flex-none">
    {/* Filtro */}
    <div className="flex flex-col flex-1 sm:flex-none sm:w-44">
      <label
        htmlFor="filtro-disponivel"
        className="text-[11px] text-marrom-escuro ml-1 mb-1"
      >
        Disponível
      </label>

      <div className="relative shrink-0" style={{ height: 'var(--campo-altura)' }}>
        <select
          id="filtro-disponivel"
          value={filtroDisponivel}
          onChange={(e) =>
            atualizarFiltro(e.target.value as 'todos' | 'sim' | 'nao')
          }
          className="appearance-none bg-branco rounded-xl shadow-sm w-full h-full px-4 pr-10 text-preto outline-none cursor-pointer"
        >
          <option value="todos">Todos</option>
          <option value="sim">Disponível</option>
          <option value="nao">Indisponível</option>
        </select>

        <Icon
          icon="mdi:chevron-down"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-preto pointer-events-none"
        />
      </div>
    </div>

    {/* Botão */}
    <div className="flex flex-col justify-end">
      <Link
        href="/admin/produtos/novo"
        className="flex items-center justify-center gap-2 bg-marrom-escuro hover:bg-marrom text-branco font-medium rounded-xl px-7 whitespace-nowrap transition-colors shrink-0"
        style={{ height: 'var(--campo-altura)' }}
      >
        <Icon icon="mdi:plus" className="text-lg" />
        Cadastrar
      </Link>
    </div>
  </div>
</div>
      {/* Grid de produtos */}
      {produtosDaPagina.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {produtosDaPagina.map((produto) => (
            <ProdutoCard key={produto.id} produto={produto} />
          ))}
        </div>
      ) : (
        <p className="text-center text-cor-pele py-10">Nenhum produto encontrado.</p>
      )}

      {/* Paginação */}
      {produtosFiltrados.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="text-marrom-escuro disabled:opacity-30"
            aria-label="Página anterior"
          >
            <Icon icon="mdi:chevron-left" className="text-2xl" />
          </button>

          <span className="bg-branco px-4 py-1.5 rounded-lg shadow-sm text-sm text-preto">
            {paginaAtual} de {totalPaginas}
          </span>

          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            className="text-marrom-escuro disabled:opacity-30"
            aria-label="Próxima página"
          >
            <Icon icon="mdi:chevron-right" className="text-2xl" />
          </button>
        </div>
      )}

    {/* Contador */}
        <p className="text-center text-sm text-preto bg-branco shadow-sm rounded-lg px-4 py-1.5 mx-auto w-fit">
            {produtosDaPagina.length} de {produtosFiltrados.length}
            {produtosFiltrados.length !== produtos.length && ` ${produtos.length} `}
        </p>
    </div>
  )
}