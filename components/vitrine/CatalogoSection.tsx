import { createClient } from '@/lib/supabase/server'
import { CATEGORIAS } from '@/lib/constants'
import CategoriaCarousel from './CategoriaCaroulsel'

export default async function CatalogoSection() {
  const supabase = await createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, categoria, fotos')
    .eq('disponivel', true)
    .order('created_at', { ascending: false })

  return (
    <section id="catalogo" className="bg-branco py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-medium text-marrom-escuro mb-10">
          Catálogo
        </h2>

        <div className="flex flex-col gap-16 md:gap-20">
          {CATEGORIAS.map((categoria) => {
            const produtosDaCategoria = (produtos ?? []).filter(
              (p) => p.categoria === categoria
            )
            if (produtosDaCategoria.length === 0) return null

            return (
              <CategoriaCarousel
                key={categoria}
                categoria={categoria}
                produtos={produtosDaCategoria}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}