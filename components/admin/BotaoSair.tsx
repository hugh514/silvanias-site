'use client'

import { useTransition } from 'react'
import { Icone as Icon } from '@/components/ui/Icone'

import { sair } from '@/lib/actions/auth'

/**
 * Botão de saída do painel (FR-030).
 *
 * Antes desta feature não havia forma de terminar a sessão: só expirando ou
 * limpando os cookies à mão. Num computador partilhado isso significa deixar o
 * painel aberto para quem se sentar a seguir.
 */
export default function BotaoSair() {
  const [saindo, iniciar] = useTransition()

  return (
    <button
      type="button"
      disabled={saindo}
      onClick={() => iniciar(async () => { await sair() })}
      className="flex items-center justify-center gap-2 bg-branco shadow-sm text-marrom-escuro
                 font-medium rounded-xl px-5 whitespace-nowrap transition-colors
                 hover:text-marrom disabled:opacity-60 text-xs lg:text-sm"
      style={{ height: 'var(--campo-altura)' }}
    >
      <Icon icon="mdi:logout" className="text-lg shrink-0" aria-hidden="true" />
      {saindo ? 'Saindo...' : 'Sair'}
    </button>
  )
}
