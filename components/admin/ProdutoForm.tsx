"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "../../supabase/client";
import { CATEGORIAS, UNIDADES, type Unidade } from "@/lib/constants";
import UploadFotos, { type FotoItem } from "./UploadFotos";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  ingredientes: string | null;
  preco_unidade: number | null;
  unidade: Unidade;
  disponivel: boolean;
  fotos: string[] | null;
};

type Props = {
  produtoExistente?: Produto;
};

const LABEL_UNIDADE: Record<Unidade, string> = {
  peso: "Preço peso",
  volume: "Preço volume",
  unidade: "Preço unidade",
};

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
  const [precoDigitos, setPrecoDigitos] = useState(
    produtoExistente?.preco_unidade
      ? Math.round(produtoExistente.preco_unidade * 100).toString()
      : "",
  );
  const [unidade, setUnidade] = useState<Unidade>(
    produtoExistente?.unidade ?? "peso",
  );
  const [quantidade, setQuantidade] = useState(""); // texto livre, ex: "60g", "500ml"
  const [disponivel, setDisponivel] = useState(
    produtoExistente?.disponivel ?? true,
  );
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // excluir produto estados
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [fotos, setFotos] = useState<FotoItem[]>(
    produtoExistente?.fotos?.map((url) => ({
      id: crypto.randomUUID(),
      preview: url,
      urlExistente: url,
    })) ?? [],
  );

  function formatarCentavosParaReal(digitos: string): string {
    if (!digitos) return "";
    const numero = Number(digitos) / 100;
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Informe o nome do produto.");
      return;
    }
    if (!precoDigitos || Number(precoDigitos) <= 0) {
      setErro("Informe um preço válido.");
      return;
    }

    setCarregando(true);
    const supabase = createClient();

    try {
      // 1. Upload das fotos novas (as que têm `arquivo`)
      const urlsFinais: string[] = [];

      for (const foto of fotos) {
        if (foto.urlExistente) {
          urlsFinais.push(foto.urlExistente);
          continue;
        }
        if (!foto.arquivo) continue;

        const caminho = `${crypto.randomUUID()}-${foto.arquivo.name}`;
        const { error: erroUpload } = await supabase.storage
          .from("produtos")
          .upload(caminho, foto.arquivo);

        if (erroUpload)
          throw new Error(
            "Erro ao enviar uma das fotos: " + erroUpload.message,
          );

        const { data } = supabase.storage
          .from("produtos")
          .getPublicUrl(caminho);
        urlsFinais.push(data.publicUrl);
      }

      // 2. Montar objeto do produto
      const objetoProduto = {
        nome: nome.trim(),
        categoria,
        descricao: descricao.trim() || null,
        ingredientes: ingredientes.trim() || null,
        preco_unidade: Number(precoDigitos) / 100,
        unidade,
        disponivel,
        fotos: urlsFinais,
      };

      // 3. Insert ou update
      const { error: erroSalvar } = editando
        ? await supabase
            .from("produtos")
            .update(objetoProduto)
            .eq("id", produtoExistente.id)
        : await supabase.from("produtos").insert(objetoProduto);

      if (erroSalvar) throw new Error(erroSalvar.message);

      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setCarregando(false);
    }
  }
  async function handleExcluir() {
    if (!produtoExistente) return;

    setExcluindo(true);
    const supabase = createClient();

    try {
      // Remove os arquivos do Storage também, pra não deixar lixo órfão
      const caminhosStorage = (produtoExistente.fotos ?? [])
        .map((url) => url.split("/produtos/").pop())
        .filter((caminho): caminho is string => !!caminho);

      if (caminhosStorage.length > 0) {
        await supabase.storage.from("produtos").remove(caminhosStorage);
      }

      const { error: erroExcluir } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produtoExistente.id);

      if (erroExcluir) throw new Error(erroExcluir.message);

      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir produto.");
      setExcluindo(false);
      setModalExcluirAberto(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-marrom-escuro">
              Nome do produto
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none"
              placeholder="Ex: Chocolate 80% com leite"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-marrom-escuro">Categoria</label>
            <div className="relative">
              <select
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-marrom-escuro">Ingredientes</label>
            <textarea
              value={ingredientes}
              onChange={(e) => setIngredientes(e.target.value)}
              rows={2}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none resize-none"
              placeholder="Ex: Cacau em pó, leite, açúcar"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-marrom-escuro">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none resize-none"
              placeholder="Descreva o produto..."
            />
          </div>

          {/* Preço, Unidade e Quantidade na mesma linha */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-marrom-escuro">
                {LABEL_UNIDADE[unidade]}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatarCentavosParaReal(precoDigitos)}
                onChange={(e) =>
                  setPrecoDigitos(e.target.value.replace(/\D/g, ""))
                }
                className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none"
                placeholder="R$ 0,00"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-marrom-escuro">Unidade</label>
              <div className="relative">
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value as Unidade)}
                  className="appearance-none w-full bg-branco rounded-xl shadow-sm px-4 py-3 pr-9 text-preto outline-none cursor-pointer"
                >
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:menu-down"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xl text-preto pointer-events-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-marrom-escuro">Quantidade</label>
              <input
                type="text"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="bg-branco rounded-xl shadow-sm px-4 py-3 text-preto outline-none"
                placeholder="Ex: 60g"
              />
            </div>
          </div>

          {/* Disponível, abaixo da linha de preço/unidade/quantidade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-marrom-escuro">Disponível</label>
            <div className="relative">
              <select
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

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {/* botões */}


      <div className="flex justify-end gap-4">
        {editando && (
          <button
            type="button"
            onClick={() => setModalExcluirAberto(true)}
            className="px-6 py-3 rounded-xl bg-branco shadow-sm text-red-600 font-medium text-xs lg:text-sm"
          >
            Excluir
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/produtos")}
          className="px-6 py-3 rounded-xl bg-branco shadow-sm text-marrom-escuro font-medium text-xs lg:text-sm"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={carregando}
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
