import Link from 'next/link'
import { notFound } from 'next/navigation'

import ProdutoForm from '@/components/admin/ProdutoForm'
import { Icone as Icon } from '@/components/ui/Icone'
import { createClient } from '@/lib/supabase/server'

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: produto, error } = await supabase.from('produtos').select('*').eq('id', id).single()
  if (error || !produto) notFound()

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <Link href="/admin/produtos" className="inline-flex items-center gap-1 text-sm text-marrom-escuro/70 hover:text-marrom-escuro">
          <Icon icon="mdi:arrow-left" />
          Produtos
        </Link>
        <h1 className="font-titulo text-2xl md:text-3xl text-marrom-escuro mt-2">{produto.nome}</h1>
      </header>
      <ProdutoForm produtoExistente={produto} />
    </div>
  )
}
