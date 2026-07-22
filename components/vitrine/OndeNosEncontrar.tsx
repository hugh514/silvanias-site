'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'

export default function OndeNosEncontrar() {
  const latitude = -11.911265741721149
  const longitude = -61.78445093828045

  const [carregando, setCarregando] = useState(true)

  // URL do iframe usando coordenadas (modo "pindrop", sem mostrar lugares vizinhos)
  const mapaEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`

  // Link do botão continua podendo usar o endereço em texto normalmente
  const mapaLinkUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <section className="bg-branco px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
          {/* Coluna de texto */}
          <div className="w-full md:flex-1 flex flex-col gap-5">
            <h2 className="text-2xl md:text-3xl font-medium text-marrom-escuro">
              Onde nos encontrar?
            </h2>

            <div className="flex gap-2">
              <Icon
                icon="mdi:map-marker-outline"
                className="text-marrom-escuro text-2xl shrink-0"
              />
              <p className="text-marrom-escuro">
                R. Sete de Setembro, 1978 - Setor 4
                <br />
                Santa Luzia D&apos;Oeste - RO
                <br />
                CEP 76950-000
              </p>
            </div>

            <div className="border-t border-marrom-escuro/30 w-full max-w-62.5" />

           <a 
              href={mapaLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start
                         bg-marrom-escuro hover:bg-marrom text-branco font-medium
                         px-8 py-3.5 rounded-xl transition-colors w-fit"
            >
              <Icon icon="mdi:map-outline" className="text-xl" />
              Ver no mapa
            </a>
          </div>

          {/* Coluna do mapa (interativo, desce no mobile) */}
          <div className="w-full md:flex-1">
            <div className="relative w-full aspect-4/3 md:aspect-16/10 rounded-2xl overflow-hidden shadow-sm bg-branco-falso">
              {carregando && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Icon
                    icon="mdi:loading"
                    className="text-marrom-escuro text-4xl animate-spin"
                  />
                </div>
              )}

              <iframe
                src={mapaEmbedUrl}
                onLoad={() => setCarregando(false)}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da Silvania's Cacau no mapa"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}