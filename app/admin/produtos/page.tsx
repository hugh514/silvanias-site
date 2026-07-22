import { createClient } from '../../../lib/supabase/server'
import ProdutosGrid from '@/components/admin/ProdutosGrid'

export default async function AdminProdutosPage() {
  const supabase = await createClient()

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria, disponivel, fotos')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-branco-falso p-6">
        <p className="text-red-600">Erro ao carregar produtos: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-branco-falso p-6">
      <ProdutosGrid produtos={produtos ?? []} />
    </main>
  )
}