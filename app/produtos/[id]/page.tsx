import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import GaleriaProduto from "@/components/vitrine/GaleriaProduto";
import { NUMEROZAP } from "@/lib/constants";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: produto, error } = await supabase
    .from("produtos")
    .select("id, nome, ingredientes, descricao, fotos")
    .eq("id", id)
    .eq("disponivel", true)
    .single();

  if (error || !produto) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-branco-falso px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho: voltar + logo */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="w-12 h-12 rounded-full bg-marrom-escuro hover:bg-marrom flex items-center justify-center shrink-0"
            aria-label="Voltar"
          >
            <Icon icon="mdi:arrow-left" className="text-branco text-xl" />
          </Link>

          {/*
            INSERIR LOGO AQUI
            Mesmo arquivo já usado em outras telas: public/images/logo.png
          */}
          <Image
            src="/images/logo.png"
            alt="Silvania's Cacau"
            width={140}
            height={140}
            className="w-24 md:w-32 h-auto"
          />
        </div>

        {/* Título — só visível no mobile, acima da galeria */}
        <h1 className="md:hidden text-2xl font-medium text-marrom-escuro mb-4">
          {produto.nome}
        </h1>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Coluna da galeria */}
          <div className="md:flex-1">
            <GaleriaProduto fotos={produto.fotos ?? []} nome={produto.nome} />
          </div>

          {/* Coluna de informações */}
          <div className="md:flex-1 flex flex-col gap-6">
            <h1 className="hidden md:block text-3xl font-medium text-marrom-escuro">
              {produto.nome}
            </h1>

            <div className="border-t border-marrom-escuro/20 pt-4">
              {produto.ingredientes && (
                <p className="text-marrom-escuro">
                  <span className="font-semibold">Ingredientes: </span>
                  {produto.ingredientes}
                </p>
              )}
              {produto.descricao && (
                <p className="text-marrom-escuro mt-2">{produto.descricao}</p>
              )}
            </div>

            <a
              href={NUMEROZAP}
              target="_blank"
              rel="noopener noreferrer"
              type="button"
              className="self-end md:self-end flex items-center justify-center gap-2
                         bg-marrom-escuro hover:bg-marrom text-branco font-medium
                         px-8 py-3.5 rounded-xl transition-colors mt-4 w-full md:w-fit"
            >
              <Icon icon="mdi:whatsapp" className="text-xl" />
              Pedir
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
