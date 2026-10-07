import Image from 'next/image'
import { Icone as Icon } from '@/components/ui/Icone'

import { ENDERECO, gerarLinkWhatsapp, INSTAGRAM_URL, MENSAGEM_ZAP_GERAL } from '@/lib/constants'

export default function Rodape() {
  const anoAtual = new Date().getFullYear()

  const contatos = [
    { nome: 'WhatsApp', icone: 'mdi:whatsapp', href: gerarLinkWhatsapp(MENSAGEM_ZAP_GERAL) },
    { nome: 'Instagram', icone: 'mdi:instagram', href: INSTAGRAM_URL },
  ] as const

  return (
    <footer className="bg-marrom-escuro text-branco px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Image
            src="/images/logo.png"
            alt="Silvania's Cacau"
            width={140}
            height={140}
            className="w-28 h-auto rounded-2xl bg-branco-falso p-3"
          />
          <p className="text-sm text-branco/70 max-w-xs">A arte de transformar paixão em sabor.</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-amarelo">Fale conosco</p>
          {contatos.map((c) => (
            <a
              key={c.nome}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-branco/85 hover:text-branco transition-colors w-fit"
            >
              <Icon icon={c.icone} className="text-xl" />
              {c.nome}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-amarelo">Endereço</p>
          <address className="not-italic text-sm text-branco/85 leading-relaxed">
            {ENDERECO.rua}
            <br />
            {ENDERECO.cidade}
            <br />
            {ENDERECO.cep}
          </address>
        </div>
      </div>

      <p className="max-w-6xl mx-auto mt-12 pt-6 border-t border-branco/15 text-xs text-branco/60">
        © {anoAtual} Silvania&apos;s Cacau. Todos os direitos reservados.
      </p>
    </footer>
  )
}
