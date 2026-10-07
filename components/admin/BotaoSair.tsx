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
      aria-label="Sair"
      onClick={() => iniciar(async () => { await sair() })}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-branco/70 hover:text-branco hover:bg-branco/10 transition-colors disabled:opacity-60 shrink-0"
    >
      <Icon icon="mdi:logout" className="text-xl shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{saindo ? 'Saindo...' : 'Sair'}</span>
    </button>
  )
}
