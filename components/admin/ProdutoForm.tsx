"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icone as Icon } from '@/components/ui/Icone'

import { CATEGORIAS } from "@/lib/constants";
import {
  atualizarProduto,
  criarProduto,
  removerProduto,
  type ResultadoAcao,
} from "@/lib/actions/produtos";
import type { CamposComErro } from "@/lib/schemas/produto";
import type { Produto } from "@/types/produto";
import UploadFotos, { type FotoItem } from "./UploadFotos";

type Props = {
  produtoExistente?: Produto;
};

/**
 * Formulário de produto.
 *
 * Antes de 2026-07-25 este componente falava diretamente com o Supabase a partir
 * do navegador: enviava ficheiros, inseria, alterava e removia linhas, tudo com a
 * chave anónima que está no pacote JavaScript do site. A única coisa a impedir um
 * estranho de fazer o mesmo eram as políticas de acesso — que, na altura,
 * permitiam a qualquer conta autenticada.
 *
 * Agora nada sai daqui diretamente para a base de dados. Tudo passa por ações de
 * servidor que verificam sessão e autorização antes de escrever.
 *
 * A aparência mantém-se exatamente igual: o redesenho é fase seguinte.
 *
 * Nota sobre `useTransition` em vez de `useActionState`: as fotos vivem em estado
 * do componente (o utilizador acrescenta e remove antes de submeter), e não num
 * `<input type="file">` que o formulário pudesse serializar sozinho. Construir o
 * FormData à mão é mais direto do que sincronizar o input com o estado. O estado
 * de submissão vem do `useTransition` e as ações mantêm a assinatura compatível
 * com `useActionState`, caso venha a fazer sentido.
 */
export default function ProdutoForm({ produtoExistente }: Props) {
  const router = useRouter();
  const editando = !!produtoExistente;

  const [nome, setNome] = useState(produtoExistente?.nome ?? "");
  const [categoria, setCategoria] = useState(
    produtoExistente?.categoria ?? CATEGORIAS[0],
  );
  const [ingredientes, setIngredientes] = useState(
    produtoExistente?.ingredientes ?? "",
  );
  const [descricao, setDescricao] = useState(produtoExistente?.descricao ?? "");
  const [disponivel, setDisponivel] = useState(
    produtoExistente?.disponivel ?? true,
  );

  const [erro, setErro] = useState("");
  const [camposComErro, setCamposComErro] = useState<CamposComErro>({});
  const [carregando, iniciarSubmissao] = useTransition();

  // excluir produto estados
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, iniciarExclusao] = useTransition();

  const [fotos, setFotos] = useState<FotoItem[]>(
    produtoExistente?.fotos?.map((url) => ({
      id: crypto.randomUUID(),
      preview: url,
      urlExistente: url,
    })) ?? [],
  );

  function tratarResultado(resultado: ResultadoAcao) {
    if (resultado.ok) {
      router.push("/admin/produtos");
      router.refresh();
      return;
    }
    setErro(resultado.erro);
    setCamposComErro(resultado.camposComErro ?? {});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCamposComErro({});

    const dados = new FormData();
    dados.set("nome", nome);
    dados.set("categoria", categoria);
    dados.set("ingredientes", ingredientes);
    dados.set("descricao", descricao);
    dados.set("disponivel", disponivel ? "sim" : "nao");

    for (const foto of fotos) {
      if (foto.urlExistente) dados.append("fotosExistentes", foto.urlExistente);
      else if (foto.arquivo) dados.append("fotosNovas", foto.arquivo);
    }

    iniciarSubmissao(async () => {
      const resultado = editando
        ? await atualizarProduto(produtoExistente.id, null, dados)
        : await criarProduto(null, dados);
      tratarResultado(resultado);
    });
  }

  function handleExcluir() {
    if (!produtoExistente) return;
    setErro("");

    iniciarExclusao(async () => {
      const resultado = await removerProduto(produtoExistente.id);
      if (resultado.ok) {
        router.push("/admin/produtos");
        router.refresh();
        return;
      }
      setErro(resultado.erro);
      setModalExcluirAberto(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-xs text-marrom-escuro">
              Nome do produto
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-invalid={!!camposComErro.nome}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none"
              placeholder="Ex: Chocolate 80% com leite"
            />
            {camposComErro.nome && (
              <span className="text-xs text-red-600">{camposComErro.nome}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoria" className="text-xs text-marrom-escuro">
              Categoria
            </label>
            <div className="relative">
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="appearance-none w-full bg-branco rounded-xl shadow-sm px-4 py-3 pr-10 text-preto outline-none cursor-pointer"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Icon
                icon="mdi:menu-down"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-preto pointer-events-none"
              />
            </div>
            {camposComErro.categoria && (
              <span className="text-xs text-red-600">{camposComErro.categoria}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ingredientes" className="text-xs text-marrom-escuro">
              Ingredientes
            </label>
            <textarea
              id="ingredientes"
              value={ingredientes}
              onChange={(e) => setIngredientes(e.target.value)}
              rows={2}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none resize-none"
              placeholder="Ex: Cacau em pó, leite, açúcar"
            />
            {camposComErro.ingredientes && (
              <span className="text-xs text-red-600">{camposComErro.ingredientes}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="descricao" className="text-xs text-marrom-escuro">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none resize-none"
              placeholder="Descreva o produto..."
            />
            {camposComErro.descricao && (
              <span className="text-xs text-red-600">{camposComErro.descricao}</span>
            )}
          </div>

          {/* Disponível */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="disponivel" className="text-xs text-marrom-escuro">
              Disponível
            </label>
            <div className="relative">
              <select
                id="disponivel"
                value={disponivel ? "sim" : "nao"}
                onChange={(e) => setDisponivel(e.target.value === "sim")}
                className="appearance-none w-full bg-branco rounded-xl shadow-sm px-4 py-3 pr-10 text-preto outline-none cursor-pointer"
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
              <Icon
                icon="mdi:menu-down"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-preto pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div>
          <UploadFotos fotos={fotos} onChange={setFotos} />
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
      {/* botões */}

      <div className="flex justify-end gap-4">
        {editando && (
          <button
            type="button"
            onClick={() => setModalExcluirAberto(true)}
            disabled={carregando || excluindo}
            className="px-6 py-3 rounded-xl bg-branco shadow-sm text-red-600 font-medium text-xs lg:text-sm disabled:opacity-60"
          >
            Excluir
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/produtos")}
          disabled={carregando || excluindo}
          className="px-6 py-3 rounded-xl bg-branco shadow-sm text-marrom-escuro font-medium text-xs lg:text-sm disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={carregando || excluindo}
          className="px-6 py-3 rounded-xl bg-marrom-escuro hover:bg-marrom text-branco text-xs lg:text-sm font-medium transition-colors disabled:opacity-60"
        >
          {carregando ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Modal de confirmação de exclusão */}
      {modalExcluirAberto && (
        <div
          className="fixed inset-0 bg-preto/60 flex items-center justify-center z-50 p-6"
          onClick={() => !excluindo && setModalExcluirAberto(false)}
        >
          <div
            className="bg-branco rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-preto font-medium">
              Tem certeza que deseja excluir {produtoExistente?.nome}?
            </p>
            <p className="text-sm text-preto/50">
              Essa ação não pode ser desfeita!
            </p>

            <div className="flex gap-4 mt-6 w-full">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                disabled={excluindo}
                className="flex-1 px-6 py-2.5 rounded-xl bg-branco-falso text-marrom-escuro font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluindo}
                className="flex-1 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-branco font-medium transition-colors disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
