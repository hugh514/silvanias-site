'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Icone as Icon } from '@/components/ui/Icone'
import type { NomeIcone } from '@/lib/icones'
import BotaoSair from './BotaoSair'

const LINKS: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: '/admin/produtos', rotulo: 'Produtos', icone: 'mdi:package-variant' },
  { href: '/admin/conteudo', rotulo: 'Textos do site', icone: 'mdi:text-box-edit-outline' },
]

export default function MenuPainel() {
  const caminho = usePathname()

  return (
    <aside className="md:w-60 md:min-h-screen md:sticky md:top-0 bg-marrom-escuro text-branco flex md:flex-col gap-2 px-4 py-3 md:py-6 items-center md:items-stretch">
      <Link href="/admin/produtos" className="shrink-0 md:mb-6 md:px-2">
        <Image
          src="/images/logo.png"
          alt="Silvania's Cacau"
          width={96}
          height={96}
          className="h-10 md:h-14 w-auto rounded-xl bg-branco-falso p-1.5"
        />
      </Link>

      <nav aria-label="Painel" className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
        {LINKS.map((l) => {
          const ativo = caminho.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo ? 'page' : undefined}
              aria-label={l.rotulo}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                ativo ? 'bg-branco/15 text-branco' : 'text-branco/70 hover:text-branco hover:bg-branco/10'
              }`}
            >
              <Icon icon={l.icone} className="text-xl shrink-0" />
              <span className="hidden sm:inline">{l.rotulo}</span>
            </Link>
          )
        })}

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver site"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap text-branco/70 hover:text-branco hover:bg-branco/10"
        >
          <Icon icon="mdi:open-in-new" className="text-xl shrink-0" />
          <span className="hidden sm:inline">Ver site</span>
        </a>
      </nav>

      <BotaoSair />
    </aside>
  )
}
