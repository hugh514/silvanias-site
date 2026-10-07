import { Fragment } from 'react'
import Image from 'next/image'
import { Icone as Icon } from '@/components/ui/Icone'
import Profundidade from './Profundidade'

import { carregarConteudo } from '@/lib/conteudo/carregar-conteudo'
import { gerarLinkWhatsapp, MENSAGEM_ZAP_GERAL } from '@/lib/constants'

const DIFERENCIAIS = [
  { icone: 'mdi:sprout-outline', texto: 'Cacau próprio' },
  { icone: 'mdi:hand-heart-outline', texto: 'Feito à mão' },
  { icone: 'mdi:map-marker-path', texto: 'Do cultivo à barra' },
] as const

export default async function Hero() {
  const { hero } = await carregarConteudo()

  return (
    <section className="bg-branco-falso overflow-x-clip px-6 pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10 md:gap-16">
        <div className="flex flex-col gap-6">
          <span className="aparecer text-xs font-medium uppercase tracking-[0.18em] text-cor-pele" style={{ '--atraso': '0.05s' } as React.CSSProperties}>
            Agroindústria de cacau · Amazônia
          </span>

          <h1 className="font-titulo text-4xl sm:text-5xl lg:text-6xl font-medium text-marrom-escuro leading-[1.05]">
            {/* Cada palavra sobe de dentro da sua própria janela. O texto
                continua inteiro no HTML para leitores de tela e busca. */}
            {/* O espaço fica FORA da janela: dentro de um inline-block ele some. */}
            {hero.titulo.split(/\s+/).map((palavra, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="palavra">
                  <span style={{ '--i': i } as React.CSSProperties}>{palavra}</span>
                </span>
              </Fragment>
            ))}
          </h1>

          <p className="aparecer text-marrom-escuro/80 text-base md:text-lg max-w-md leading-relaxed" style={{ '--atraso': '0.55s' } as React.CSSProperties}>
            {hero.descricao}
          </p>

          <div className="aparecer flex flex-wrap gap-3" style={{ '--atraso': '0.7s' } as React.CSSProperties}>
            <a
              href="#catalogo"
              className="bg-marrom-escuro hover:bg-marrom text-branco font-medium px-7 py-3.5 rounded-full transition-colors"
            >
              Ver catálogo
            </a>
            <a
              href={gerarLinkWhatsapp(MENSAGEM_ZAP_GERAL)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-marrom-escuro/30 hover:border-marrom-escuro text-marrom-escuro font-medium px-7 py-3.5 rounded-full transition-colors"
            >
              <Icon icon="mdi:whatsapp" className="text-xl" />
              Pedir pelo WhatsApp
            </a>
          </div>

          <ul className="aparecer flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-marrom-escuro/80" style={{ '--atraso': '0.85s' } as React.CSSProperties}>
            {DIFERENCIAIS.map((d) => (
              <li key={d.texto} className="flex items-center gap-2">
                <Icon icon={d.icone} className="text-cor-pele text-lg" />
                {d.texto}
              </li>
            ))}
          </ul>
        </div>

        {/* Palco em camadas: a foto ao fundo e recortes da própria marca à frente,
            cada um a mover-se a uma profundidade diferente. */}
        <Profundidade className="relative w-full max-w-md md:max-w-none mx-auto aspect-4/5 md:aspect-square">
          <Image
            src="/images/camadas/folha-2.webp"
            alt=""
            width={198}
            height={184}
            className="camada entrar absolute -left-[4%] -top-[3%] w-[20%] h-auto blur-[1.5px] opacity-90"
            style={{ '--prof': -14, '--atraso': '0.35s' } as React.CSSProperties}
          />

          <div className="entrar absolute inset-[7%]" style={{ '--atraso': '0s' } as React.CSSProperties}>
            <div className="palco-foto camada relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(53,21,3,0.6)]" style={{ '--prof': 8 } as React.CSSProperties}>
              <Image
                src="/images/hero-v3.png"
                alt="Barra de chocolate Silvania's Cacau ao lado de um café"
                fill
                priority
                sizes="(min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>

          <div
            className="camada entrar absolute -left-[2%] bottom-[2%] w-[34%]"
            style={{ '--prof': 26, '--atraso': '0.15s' } as React.CSSProperties}
          >
            <Image
              src="/images/camadas/chocolate.webp"
              alt=""
              width={425}
              height={485}
              className="w-full h-auto rounded-2xl border-[5px] border-branco -rotate-6 shadow-[0_24px_40px_-18px_rgba(53,21,3,0.55)]"
            />
          </div>

          <div
            className="camada entrar absolute right-[0%] top-[1%] w-[24%]"
            style={{ '--prof': 34, '--atraso': '0.25s' } as React.CSSProperties}
          >
            <Image
              src="/images/camadas/graos.webp"
              alt=""
              width={310}
              height={490}
              className="w-full h-auto rounded-2xl border-[5px] border-branco rotate-6 shadow-[0_24px_40px_-18px_rgba(53,21,3,0.55)]"
            />
          </div>

          <Image
            src="/images/camadas/folha-1.webp"
            alt=""
            width={223}
            height={192}
            className="camada entrar absolute -right-[3%] bottom-[16%] w-[22%] h-auto drop-shadow-[0_18px_14px_rgba(53,21,3,0.35)]"
            style={{ '--prof': 52, '--atraso': '0.45s' } as React.CSSProperties}
          />
        </Profundidade>
      </div>
    </section>
  )
}
