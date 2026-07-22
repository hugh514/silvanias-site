import { createClient } from '@/lib/supabase/server'
import ProdutoForm from '@/components/admin/ProdutoForm'
import { notFound } from 'next/navigation'

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !produto) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-branco-falso p-6">
      <ProdutoForm produtoExistente={produto} />
    </main>
  )
}