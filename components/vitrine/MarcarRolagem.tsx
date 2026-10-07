'use client'

import { useEffect } from 'react'

/** Marca `data-rolado` no <html> depois de alguns pixels de rolagem (menu compacto). */
export default function MarcarRolagem() {
  useEffect(() => {
    const html = document.documentElement
    const aoRolar = () => html.toggleAttribute('data-rolado', scrollY > 24)
    aoRolar()
    addEventListener('scroll', aoRolar, { passive: true })
    return () => removeEventListener('scroll', aoRolar)
  }, [])
  return null
}
