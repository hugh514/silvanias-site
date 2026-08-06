'use client'

import { useEffect } from 'react'

/**
 * Limite de erro da rota raiz — a página com mais tráfego do site.
 *
 * Mostra mensagem em português e NÃO expõe `error.message`, que pode conter
 * detalhes internos da base de dados (FR-029).
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // O detalhe fica no servidor, onde é útil; ao visitante chega só o resumo.
    console.error('[vitrine]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-branco-falso flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-medium text-marrom-escuro">
          Algo deu errado por aqui
        </h1>
        <p className="text-marrom-escuro/80">
          Não conseguimos carregar esta página agora. Tente novamente em instantes.
        </p>
        <button
          onClick={reset}
          className="mt-2 bg-marrom-escuro hover:bg-marrom text-branco font-medium px-8 py-3.5 rounded-xl transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
}
