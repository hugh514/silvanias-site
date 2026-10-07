import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Icone as Icon } from '@/components/ui/Icone'
import Cabecalho from '@/components/vitrine/Cabecalho'
import GaleriaProduto from '@/components/vitrine/GaleriaProduto'
import Rodape from '@/components/vitrine/Rodape'
import { gerarLinkWhatsapp } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: produto } = await supabase
    .from('produtos')
    .select('nome, descricao, fotos')
    .eq('id', id)
    .eq('disponivel', true)
    .maybeSingle()

  if (!produto) return { title: 'Produto' }

  const descricao = produto.descricao
    ? produto.descricao.length > 160
      ? `${produto.descricao.slice(0, 157).trimEnd()}...`
      : produto.descricao
    : undefined
  const foto = produto.fotos?.[0]

  return {
    title: produto.nome,
    description: descricao,
    openGraph: {
      title: produto.nome,
      description: descricao,
      ...(foto && { images: [foto] }),
    },
  }
}

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria, ingredientes, descricao, fotos')
    .eq('id', id)
    .eq('disponivel', true)
    .single()

  if (error || !produto) notFound()

  const linkPedido = gerarLinkWhatsapp(
    `Olá! Vi o produto "${produto.nome}" no site de vocês e fiquei interessado(a). Pode me passar mais informações?`
  )

  return (
    <>
      <Cabecalho />
      <main className="bg-branco-falso px-6 py-8 md:py-14">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Navegação estrutural" className="mb-8 text-sm text-marrom-escuro/70">
            <Link href="/#catalogo" className="inline-flex items-center gap-1 hover:text-marrom-escuro">
              <Icon icon="mdi:arrow-left" />
              Voltar ao catálogo
            </Link>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <GaleriaProduto fotos={produto.fotos ?? []} nome={produto.nome} />

            <div className="flex flex-col gap-6 md:sticky md:top-24">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">
                {produto.categoria}
              </span>
              <h1 className="font-titulo text-3xl md:text-5xl font-medium text-marrom-escuro leading-tight">
                {produto.nome}
              </h1>

              {produto.descricao && (
                <p className="text-marrom-escuro/80 leading-relaxed md:text-lg">{produto.descricao}</p>
              )}

              {produto.ingredientes && (
                <div className="rounded-2xl bg-branco p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-cor-pele mb-2">Ingredientes</p>
                  <p className="text-marrom-escuro">{produto.ingredientes}</p>
                </div>
              )}

              <a
                href={linkPedido}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-marrom-escuro hover:bg-marrom text-branco font-medium px-8 py-4 rounded-full transition-colors w-full md:w-fit"
              >
                <Icon icon="mdi:whatsapp" className="text-xl" />
                Pedir pelo WhatsApp
              </a>
              <p className="text-sm text-marrom-escuro/60">
                Valores e condições são combinados direto com a gente na conversa.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Rodape />
    </>
  )
}
