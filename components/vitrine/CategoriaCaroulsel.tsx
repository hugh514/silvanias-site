"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ProdutoCardVitrine from "./ProdutoCardVitrine";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  fotos: string[] | null;
};

type Props = {
  categoria: string;
  produtos: Produto[];
};

// Mapeia categoria -> imagem de destaque fixa no início da lista
const IMAGEM_CATEGORIA: Record<string, string> = {
  Chocolate: "/images/categoria-chocolate-v3.png",
  "Derivados do Cacau": "/images/categoria-derivados-v2.png",
};

export default function CategoriaCarousel({ categoria, produtos }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progresso, setProgresso] = useState(0);
  const arrastando = useRef(false);
  const inicioX = useRef(0);
  const scrollInicial = useRef(0);
  const moveu = useRef(false);

  function atualizarProgresso() {
    const el = scrollRef.current;
    if (!el) return;
    const maximo = el.scrollWidth - el.clientWidth;
    setProgresso(maximo > 0 ? el.scrollLeft / maximo : 0);
  }

  function onPointerDown(e: React.PointerEvent) {
    const el = scrollRef.current;
    if (!el) return;
    arrastando.current = true;
    moveu.current = false;
    inicioX.current = e.clientX;
    scrollInicial.current = el.scrollLeft;
//    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!arrastando.current || !scrollRef.current) return;
    const delta = e.clientX - inicioX.current;

    if (Math.abs(delta) > 5) {
      moveu.current = true;
    }

    scrollRef.current.scrollLeft = scrollInicial.current - delta;
  }

  function onPointerUp() {
    arrastando.current = false;
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-marrom-escuro">{categoria}</h3>

    <div
  ref={scrollRef}
  onScroll={atualizarProgresso}
  onPointerDown={onPointerDown}
  onPointerMove={onPointerMove}
  onPointerUp={onPointerUp}
  onPointerLeave={onPointerUp}
  onClickCapture={(e) => {
    if (moveu.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }}
  className="flex gap-5 overflow-x-auto cursor-grab active:cursor-grabbing select-none
            py-4 -my-4
            scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
>
        {/* Imagem fixa de destaque, primeiro item da lista, rola junto com os cards */}
        {IMAGEM_CATEGORIA[categoria] && (
          <div className="relative shrink-0 w-55 sm:w-70 md:w-85 aspect-4/3 rounded-2xl overflow-hidden">
            <Image
              src={IMAGEM_CATEGORIA[categoria]}
              alt={categoria}
              fill
              className="object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        )}

        {produtos.map((produto) => (
          <ProdutoCardVitrine key={produto.id} produto={produto} />
        ))}
      </div>

      {/* Indicador de progresso — não clicável, só reflete o scroll */}
      <div className="w-full h-1 bg-branco-falso rounded-full overflow-hidden max-w-xs">
        <div
          className="h-full bg-marrom-escuro rounded-full transition-[width] duration-100"
          style={{ width: `${progresso * 100}%` }}
        />
      </div>
    </div>
  );
}
