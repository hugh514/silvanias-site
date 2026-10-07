import { Icone as Icon } from '@/components/ui/Icone'

const MENSAGENS = {
  criado: 'Produto cadastrado.',
  salvo: 'Alterações salvas.',
  excluido: 'Produto excluído.',
  ordem: 'Nova ordem salva. O site já mostra os produtos nessa sequência.',
} as const

export type TipoAviso = keyof typeof MENSAGENS

/** Confirmação depois de redirecionar (`?aviso=salvo`), sem biblioteca de toast. */
export default function Aviso({ tipo }: { tipo?: string }) {
  if (!tipo || !(tipo in MENSAGENS)) return null

  return (
    <p role="status" className="flex items-center gap-2 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-sm">
      <Icon icon="mdi:check-circle-outline" className="text-lg shrink-0" />
      {MENSAGENS[tipo as TipoAviso]}
    </p>
  )
}
