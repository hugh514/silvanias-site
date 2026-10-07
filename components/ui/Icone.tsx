import { Icon, type IconProps } from '@iconify/react'

import { ICONES, type NomeIcone } from '@/lib/icones'

type Props = Omit<IconProps, 'icon'> & { icon: NomeIcone }

/** `Icon` do Iconify com os dados já no pacote — renderiza no servidor, sem pedido de rede. */
export function Icone({ icon, ...resto }: Props) {
  return <Icon icon={ICONES[icon]} ssr {...resto} />
}
