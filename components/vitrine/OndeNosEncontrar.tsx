import { Icone as Icon } from '@/components/ui/Icone'

import { carregarConteudo } from '@/lib/conteudo/carregar-conteudo'

export default async function OndeNosEncontrar() {
  const { onde_encontrar } = await carregarConteudo()
  const { lat: latitude, lng: longitude } = onde_encontrar
  const mapaEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
  const mapaLinkUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <section id="onde-estamos" className="bg-branco px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr_3fr] gap-10 items-stretch">
        <div className="revelar flex flex-col gap-6 justify-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">Onde estamos</span>
          <h2 className="font-titulo text-3xl md:text-5xl font-medium text-marrom-escuro">Venha nos visitar</h2>

          <address className="not-italic flex gap-3 text-marrom-escuro">
            <Icon icon="mdi:map-marker-outline" className="text-2xl shrink-0 text-cor-pele" />
            <span className="whitespace-pre-line">{onde_encontrar.endereco}</span>
          </address>

          <a
            href={mapaLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start bg-marrom-escuro hover:bg-marrom text-branco font-medium px-7 py-3.5 rounded-full transition-colors"
          >
            <Icon icon="mdi:directions" className="text-xl" />
            Como chegar
          </a>
        </div>

        {/* O fundo com o link fica por baixo: se o iframe não carregar, ainda há saída. */}
        <div className="relative w-full aspect-4/3 md:aspect-auto md:min-h-96 rounded-3xl overflow-hidden bg-branco-falso">
          <a
            href={mapaLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-marrom-escuro/70"
          >
            <Icon icon="mdi:map-outline" className="text-4xl" />
            <span className="text-sm">Abrir no Google Maps</span>
          </a>
          <iframe
            src={mapaEmbedUrl}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Silvania's Cacau no mapa"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
