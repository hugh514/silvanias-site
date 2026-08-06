'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErroProduto({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[produto]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-branco-falso flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-medium text-marrom-escuro">
          Não foi possível mostrar este produto
        </h1>
        <p className="text-marrom-escuro/80">
          Tente novamente ou volte ao catálogo para ver os outros produtos.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="bg-marrom-escuro hover:bg-marrom text-branco font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/#catalogo"
            className="bg-branco shadow-sm text-marrom-escuro font-medium px-6 py-3 rounded-xl"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </main>
  )
}
