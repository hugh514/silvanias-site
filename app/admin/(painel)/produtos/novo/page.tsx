import Link from 'next/link'

import ProdutoForm from '@/components/admin/ProdutoForm'
import { Icone as Icon } from '@/components/ui/Icone'

export default function NovoProdutoPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header>
        <Link href="/admin/produtos" className="inline-flex items-center gap-1 text-sm text-marrom-escuro/70 hover:text-marrom-escuro">
          <Icon icon="mdi:arrow-left" />
          Produtos
        </Link>
        <h1 className="font-titulo text-2xl md:text-3xl text-marrom-escuro mt-2">Novo produto</h1>
      </header>
      <ProdutoForm />
    </div>
  )
}
