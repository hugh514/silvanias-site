import { createClient } from '@/lib/supabase/server'
import { CATEGORIAS, gerarLinkWhatsapp, MENSAGEM_ZAP_GERAL } from '@/lib/constants'
import NavCategorias from './NavCategorias'
import ProdutoCardVitrine from './ProdutoCardVitrine'

/** "Derivados do Cacau" → "cat-derivados-do-cacau" */
const idCategoria = (c: string) =>
  'cat-' + c.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default async function CatalogoSection() {
  const supabase = await createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, categoria, fotos, destaque')
    .eq('disponivel', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })

  const lista = produtos ?? []
  const grupos = CATEGORIAS.map((categoria) => ({
    categoria,
    id: idCategoria(categoria),
    produtos: lista.filter((p) => p.categoria === categoria),
  })).filter((g) => g.produtos.length > 0)

  return (
    <section id="catalogo" className="bg-branco px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div data-revelar className="flex flex-col gap-3 mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">Nossos produtos</span>
          <h2 className="font-titulo text-3xl md:text-5xl font-medium text-marrom-escuro">Catálogo</h2>
          <p className="text-marrom-escuro/75">
            Escolha um produto para ver os detalhes. Valores e condições são combinados direto com a gente pelo
            WhatsApp.
          </p>
        </div>

        {lista.length === 0 ? (
          <div className="rounded-3xl bg-branco-falso px-6 py-14 text-center flex flex-col items-center gap-4">
            <p className="text-marrom-escuro">Estamos atualizando o catálogo.</p>
            <a
              href={gerarLinkWhatsapp(MENSAGEM_ZAP_GERAL)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-marrom-escuro hover:bg-marrom text-branco font-medium px-6 py-3 rounded-full transition-colors"
            >
              Pergunte pelo WhatsApp
            </a>
          </div>
        ) : (
          <>
          <NavCategorias categorias={grupos.map((g) => ({ id: g.id, nome: g.categoria, total: g.produtos.length }))} />
          <div className="flex flex-col gap-16">
            {grupos.map(({ categoria, id, produtos: daCategoria }) => {
              return (
                <div key={categoria} id={id} className="flex flex-col gap-6 scroll-mt-36">
                  <div data-revelar className="flex items-baseline justify-between gap-4 border-b border-marrom-escuro/10 pb-3">
                    <h3 className="font-titulo text-2xl text-marrom-escuro">{categoria}</h3>
                    <span className="text-sm text-marrom-escuro/60">
                      {daCategoria.length} {daCategoria.length === 1 ? 'produto' : 'produtos'}
                    </span>
                  </div>

                  <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {daCategoria.map((produto) => (
                      <li key={produto.id} data-revelar>
                        <ProdutoCardVitrine produto={produto} />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>
    </section>
  )
}
