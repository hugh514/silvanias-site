'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import PaginaAviso, { classeBotaoPrimario, classeBotaoSecundario } from '@/components/vitrine/PaginaAviso'

/**
 * Limite de erro do site público (também cobre a página de produto).
 * NÃO mostra `error.message`, que pode conter detalhes internos (FR-029).
 */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // O detalhe fica no console/servidor, onde é útil; ao visitante chega só o resumo.
    console.error('[vitrine]', error)
  }, [error])

  return (
    <PaginaAviso
      tipo="erro"
      titulo="A barra quebrou no caminho"
      texto="Não conseguimos carregar esta página agora. Tente de novo em instantes. Se continuar, fale com a gente pelo WhatsApp."
    >
      <button type="button" onClick={reset} className={classeBotaoPrimario}>
        Tentar de novo
      </button>
      <Link href="/" className={classeBotaoSecundario}>
        Ir para o início
      </Link>
    </PaginaAviso>
  )
}
