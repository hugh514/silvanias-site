import Link from 'next/link'

import Aviso from '@/components/admin/Aviso'
import ProdutosTabela from '@/components/admin/ProdutosTabela'
import { Icone as Icon } from '@/components/ui/Icone'
import { createClient } from '@/lib/supabase/server'

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>
}) {
  const { aviso } = await searchParams
  const supabase = await createClient()

  // Mesma ordem da vitrine, para o painel mostrar o que o visitante vê.
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria, disponivel, fotos, ordem, destaque')
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-titulo text-2xl md:text-3xl text-marrom-escuro">Produtos</h1>
          <p className="text-sm text-marrom-escuro/60">Na ordem em que aparecem no site.</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 bg-marrom-escuro hover:bg-marrom text-branco text-sm font-medium rounded-full px-5 h-11 transition-colors"
        >
          <Icon icon="mdi:plus" className="text-lg" />
          Novo produto
        </Link>
      </header>

      <Aviso tipo={aviso} />

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          Não foi possível carregar os produtos. Atualize a página.
        </p>
      ) : (
        <ProdutosTabela produtos={produtos ?? []} />
      )}
    </div>
  )
}
