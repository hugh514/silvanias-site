import { Icone as Icon } from '@/components/ui/Icone'

const MENSAGEM = 'A arte de transformar paixão em sabor'

export default function Marquee() {
  // Repete o conteúdo várias vezes para preencher telas largas sem espaço vazio
  const itens = Array.from({ length: 8 })

  return (
    <div className="bg-marrom-escuro overflow-hidden py-3">
      <div className="flex w-max animate-marquee">
        {/* Duplicamos o bloco inteiro duas vezes: enquanto o primeiro sai pela esquerda, o segundo entra pela direita, sem deixar espaço vazio no loop */}
        {[0, 1].map((bloco) => (
          <div key={bloco} className="flex shrink-0">
            {itens.map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6">
                <Icon icon="mdi:star" className="text-amarelo text-lg shrink-0" />
                <span className="text-branco text-sm font-medium whitespace-nowrap">
                  {MENSAGEM}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}