import Image from 'next/image'
import { Icone as Icon } from '@/components/ui/Icone'

import { gerarLinkWhatsapp, MENSAGEM_ZAP_GERAL } from '@/lib/constants'

const DIFERENCIAIS = [
  { icone: 'mdi:sprout-outline', texto: 'Cacau próprio' },
  { icone: 'mdi:hand-heart-outline', texto: 'Feito à mão' },
  { icone: 'mdi:map-marker-path', texto: 'Do cultivo à barra' },
] as const

export default function Hero() {
  return (
    <section className="bg-branco-falso px-6 pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10 md:gap-16">
        <div className="flex flex-col gap-6">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">
            Agroindústria de cacau · Amazônia
          </span>

          <h1 className="font-titulo text-4xl sm:text-5xl lg:text-6xl font-medium text-marrom-escuro leading-[1.05]">
            Chocolates artesanais que dão água na boca
          </h1>

          <p className="text-marrom-escuro/80 text-base md:text-lg max-w-md leading-relaxed">
            Todos os produtos da Silvania&apos;s Cacau são feitos com cacau próprio, garantindo origem,
            qualidade e rastreabilidade do cultivo à produção.
          </p>

          <div className="flex flex-wrap gap-3">
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

          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-marrom-escuro/80">
            {DIFERENCIAIS.map((d) => (
              <li key={d.texto} className="flex items-center gap-2">
                <Icon icon={d.icone} className="text-cor-pele text-lg" />
                {d.texto}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-4/5 md:aspect-square w-full rounded-3xl overflow-hidden shadow-[0_24px_60px_-24px_rgba(53,21,3,0.45)]">
          <Image
            src="/images/hero-v3.png"
            alt="Barra de chocolate Silvania's Cacau ao lado de um café"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
