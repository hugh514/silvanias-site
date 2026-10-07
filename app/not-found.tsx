import type { Metadata } from 'next'
import Link from 'next/link'

import PaginaAviso, { classeBotaoPrimario, classeBotaoSecundario } from '@/components/vitrine/PaginaAviso'

export const metadata: Metadata = { title: 'Página não encontrada' }

export default function NaoEncontrada() {
  return (
    <PaginaAviso
      tipo="404"
      titulo="Esse grão saiu da trilha"
      texto="A página que você procurou não existe ou mudou de lugar. O produto pode ter saído do catálogo."
    >
      <Link href="/#catalogo" className={classeBotaoPrimario}>
        Ver o catálogo
      </Link>
      <Link href="/" className={classeBotaoSecundario}>
        Ir para o início
      </Link>
    </PaginaAviso>
  )
}
