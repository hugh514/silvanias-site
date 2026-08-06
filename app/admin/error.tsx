'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Limite de erro do painel. Sem isto, uma falha em qualquer página derrubava
 * toda a árvore de administração.
 */
export default function ErroAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-branco-falso flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-medium text-marrom-escuro">
          Não foi possível carregar esta tela
        </h1>
        <p className="text-marrom-escuro/80">
          Tente novamente. Se o problema continuar, saia e entre no painel de novo.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="bg-marrom-escuro hover:bg-marrom text-branco font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/admin/produtos"
            className="bg-branco shadow-sm text-marrom-escuro font-medium px-6 py-3 rounded-xl"
          >
            Voltar aos produtos
          </Link>
        </div>
      </div>
    </main>
  )
}
