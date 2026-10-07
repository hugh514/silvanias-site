/**
 * Ícones empacotados com o site. O @iconify/react, com nomes em texto, vai buscar
 * cada ícone a api.iconify.design no navegador — atrasa e falha offline.
 * Para usar um ícone novo: importar aqui e acrescentar ao mapa.
 */
import arrowLeft from '@iconify-icons/mdi/arrow-left'
import arrowTopRight from '@iconify-icons/mdi/arrow-top-right'
import chevronDown from '@iconify-icons/mdi/chevron-down'
import chevronLeft from '@iconify-icons/mdi/chevron-left'
import chevronRight from '@iconify-icons/mdi/chevron-right'
import close from '@iconify-icons/mdi/close'
import cloudUploadOutline from '@iconify-icons/mdi/cloud-upload-outline'
import directions from '@iconify-icons/mdi/directions'
import eyeOutline from '@iconify-icons/mdi/eye-outline'
import eyeOffOutline from '@iconify-icons/mdi/eye-off-outline'
import emailOutline from '@iconify-icons/mdi/email-outline'
import handHeartOutline from '@iconify-icons/mdi/hand-heart-outline'
import imageOffOutline from '@iconify-icons/mdi/image-off-outline'
import instagram from '@iconify-icons/mdi/instagram'
import lockOutline from '@iconify-icons/mdi/lock-outline'
import logout from '@iconify-icons/mdi/logout'
import magnify from '@iconify-icons/mdi/magnify'
import mapMarkerOutline from '@iconify-icons/mdi/map-marker-outline'
import mapMarkerPath from '@iconify-icons/mdi/map-marker-path'
import mapOutline from '@iconify-icons/mdi/map-outline'
import menuDown from '@iconify-icons/mdi/menu-down'
import plus from '@iconify-icons/mdi/plus'
import sproutOutline from '@iconify-icons/mdi/sprout-outline'
import star from '@iconify-icons/mdi/star'
import whatsapp from '@iconify-icons/mdi/whatsapp'
import packageVariant from '@iconify-icons/mdi/package-variant'
import textBoxEditOutline from '@iconify-icons/mdi/text-box-edit-outline'
import openInNew from '@iconify-icons/mdi/open-in-new'
import pencilOutline from '@iconify-icons/mdi/pencil-outline'
import checkCircleOutline from '@iconify-icons/mdi/check-circle-outline'
import alertCircleOutline from '@iconify-icons/mdi/alert-circle-outline'
import dragIcone from '@iconify-icons/mdi/drag'
import arrowUpIcone from '@iconify-icons/mdi/arrow-up'
import arrowDownIcone from '@iconify-icons/mdi/arrow-down'
import sortIcone from '@iconify-icons/mdi/sort'

export const ICONES = {
  'mdi:drag': dragIcone,
  'mdi:arrow-up': arrowUpIcone,
  'mdi:arrow-down': arrowDownIcone,
  'mdi:sort': sortIcone,
  'mdi:package-variant': packageVariant,
  'mdi:text-box-edit-outline': textBoxEditOutline,
  'mdi:open-in-new': openInNew,
  'mdi:pencil-outline': pencilOutline,
  'mdi:check-circle-outline': checkCircleOutline,
  'mdi:alert-circle-outline': alertCircleOutline,
  'mdi:arrow-left': arrowLeft,
  'mdi:arrow-top-right': arrowTopRight,
  'mdi:chevron-down': chevronDown,
  'mdi:chevron-left': chevronLeft,
  'mdi:chevron-right': chevronRight,
  'mdi:close': close,
  'mdi:cloud-upload-outline': cloudUploadOutline,
  'mdi:directions': directions,
  'mdi:eye-outline': eyeOutline,
  'mdi:eye-off-outline': eyeOffOutline,
  'mdi:email-outline': emailOutline,
  'mdi:hand-heart-outline': handHeartOutline,
  'mdi:image-off-outline': imageOffOutline,
  'mdi:instagram': instagram,
  'mdi:lock-outline': lockOutline,
  'mdi:logout': logout,
  'mdi:magnify': magnify,
  'mdi:map-marker-outline': mapMarkerOutline,
  'mdi:map-marker-path': mapMarkerPath,
  'mdi:map-outline': mapOutline,
  'mdi:menu-down': menuDown,
  'mdi:plus': plus,
  'mdi:sprout-outline': sproutOutline,
  'mdi:star': star,
  'mdi:whatsapp': whatsapp,
} as const

export type NomeIcone = keyof typeof ICONES
