import Image from 'next/image'
import Link from 'next/link'
import { Icone as Icon } from '@/components/ui/Icone'

import { gerarLinkWhatsapp, MENSAGEM_ZAP_GERAL } from '@/lib/constants'

const LINKS = [
  { href: '/#catalogo', rotulo: 'Catálogo' },
  { href: '/#quem-somos', rotulo: 'Quem somos' },
  { href: '/#onde-estamos', rotulo: 'Onde estamos' },
]

export default function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 bg-branco-falso/90 backdrop-blur border-b border-marrom-escuro/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" aria-label="Silvania's Cacau — início" className="shrink-0">
          <Image src="/images/logo.png" alt="Silvania's Cacau" width={96} height={96} className="h-11 w-auto" priority />
        </Link>

        <nav aria-label="Principal" className="hidden md:flex items-center gap-8 text-sm text-marrom-escuro">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-marrom transition-colors">
              {l.rotulo}
            </a>
          ))}
        </nav>

        <a
          href={gerarLinkWhatsapp(MENSAGEM_ZAP_GERAL)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-marrom-escuro hover:bg-marrom text-branco text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
        >
          <Icon icon="mdi:whatsapp" className="text-lg" />
          <span>Fale conosco</span>
        </a>
      </div>
    </header>
  )
}
