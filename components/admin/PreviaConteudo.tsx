import Image from 'next/image'

import { Icone as Icon } from '@/components/ui/Icone'
import type { ChaveConteudo } from '@/lib/schemas/conteudo-site'

type Valores = Record<string, string | number>

/**
 * Miniatura de cada seção da vitrine, no mesmo estilo do site, para a dona ver
 * o resultado enquanto digita. Só apresentação: não grava nada.
 */
export default function PreviaConteudo({ chave, valores }: { chave: ChaveConteudo; valores: Valores }) {
  const v = (campo: string) => String(valores[campo] ?? '')

  switch (chave) {
    case 'hero':
      return (
        <div className="grid grid-cols-[1.3fr_1fr] gap-4 items-center bg-branco-falso p-5">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[9px] uppercase tracking-[0.18em] text-cor-pele">Agroindústria de cacau · Amazônia</span>
            <p className="font-titulo text-xl leading-tight text-marrom-escuro break-words">{v('titulo') || 'Título'}</p>
            <p className="text-[11px] leading-relaxed text-marrom-escuro/75 line-clamp-4 break-words">{v('descricao')}</p>
            <span className="self-start mt-1 rounded-full bg-marrom-escuro px-3 py-1 text-[10px] text-branco">Ver catálogo</span>
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image src="/images/hero-v3.png" alt="" fill sizes="160px" className="object-cover" />
          </div>
        </div>
      )
    case 'marquee':
      return (
        <div className="bg-marrom-escuro py-3 overflow-hidden whitespace-nowrap text-[11px] text-branco">
          {[0, 1, 2].map((i) => (
            <span key={i} className="inline-flex items-center gap-2 px-4">
              <Icon icon="mdi:star" className="text-amarelo" />
              {v('mensagem') || 'Frase da faixa'}
            </span>
          ))}
        </div>
      )
    case 'quem_somos':
      return (
        <div className="grid grid-cols-[1fr_1.4fr] gap-4 bg-branco-falso p-5">
          <div className="relative aspect-4/5 rounded-xl overflow-hidden">
            <Image src="/images/imagem-quem-somos-2-v2.png" alt="" fill sizes="140px" className="object-cover" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[9px] uppercase tracking-[0.18em] text-cor-pele">Quem somos</span>
            <p className="font-titulo text-lg leading-tight text-marrom-escuro break-words">{v('titulo') || 'Título'}</p>
            <p className="text-[11px] leading-relaxed text-marrom-escuro/75 whitespace-pre-line line-clamp-6 break-words">
              {v('texto')}
            </p>
          </div>
        </div>
      )
    case 'onde_encontrar':
      return (
        <div className="flex flex-col gap-2 bg-branco p-5">
          <span className="text-[9px] uppercase tracking-[0.18em] text-cor-pele">Onde estamos</span>
          <p className="font-titulo text-lg text-marrom-escuro">Venha nos visitar</p>
          <p className="flex gap-2 text-[11px] text-marrom-escuro whitespace-pre-line">
            <Icon icon="mdi:map-marker-outline" className="text-base text-cor-pele shrink-0" />
            {v('endereco')}
          </p>
          <span className="text-[10px] text-marrom-escuro/50 tabular-nums">
            Mapa em {Number(valores.lat || 0).toFixed(4)}, {Number(valores.lng || 0).toFixed(4)}
          </span>
        </div>
      )
    case 'rodape':
      return (
        <div className="flex items-center gap-4 bg-marrom-escuro p-5 text-branco">
          <Image src="/images/logo-claro.png" alt="" width={64} height={48} className="w-14 h-auto shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[11px] text-branco/75 break-words">{v('frase')}</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-branco/85 truncate">
              <Icon icon="mdi:instagram" />
              {v('instagram_url').replace(/^https:\/\/(www\.)?/, '')}
            </span>
          </div>
        </div>
      )
  }
}
