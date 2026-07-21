import Image from 'next/image'
import { Icon } from '@iconify/react'
import { NUMEROZAP } from '@/lib/constants'

/**
 * Rodapé — conteúdo fixo (links de contato só mudam por código).
 */
export default function Rodape() {


  const redesSociais = [
    {
      nome: 'WhatsApp',
      icone: 'mdi:whatsapp',
      // Troque pelo número real, formato internacional sem espaços/símbolos
      href: NUMEROZAP,
    },
    {
      nome: 'Instagram',
      icone: 'mdi:instagram',
      href: 'https://instagram.com/silvaniascacau',
    },
   
  ]

  return (
    <footer className="bg-rodape px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-4">
        <Image
          src="/images/logo.png"
          alt="Silvania's Cacau"
          width={140}
          height={140}
          className="w-50 h-auto"
        />

        <p className="text-branco text-lg">Fale conosco</p>

        <div className="flex items-center gap-4">
          {redesSociais.map((rede) => (
            <a
              key={rede.nome}
              href={rede.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={rede.nome}
              className="w-12 h-12 rounded-full border border-branco/70
                         flex items-center justify-center
                         text-branco hover:bg-branco/10 transition-colors"
            >
              <Icon icon={rede.icone} className="text-2xl" />
            </a>
          ))}
        </div>
      </div>      
    </footer>
  )
}