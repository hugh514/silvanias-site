import Image from 'next/image'

export default function QuemSomos() {
  return (
    <section className="bg-branco-falso px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto">
        <style>{`
          @media (min-width: 768px) {
            .quem-somos-grid {
              grid-template-areas:
                "img1 titulo"
                "img1 texto"
                "img1 img2" !important;
              grid-template-columns: 0.85fr 1.15fr !important;
              grid-template-rows: auto auto 1fr !important;
            }
          }
        `}</style>

        <div
          className="quem-somos-grid grid gap-x-10 gap-y-4 md:gap-y-6"
          style={{
            gridTemplateAreas: `"titulo titulo" "img1 texto" "img2 img2"`,
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          {/* Título */}
          <h2
            style={{ gridArea: 'titulo' }}
            className="text-2xl md:text-3xl font-medium text-marrom-escuro self-start"
          >
            Quem somos?
          </h2>

          {/* Imagem 1 — pé de cacau (retrato) */}
          <div
            style={{ gridArea: 'img1' }}
            className="relative w-full h-full min-h-65 md:min-h-105 rounded-2xl overflow-hidden"
          >
            <Image
              src="/images/imagem-quem-somos-2.png"
              alt="Pé de cacau na Amazônia"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 45vw"
            />
          </div>

          {/* Texto */}
          <p
            style={{ gridArea: 'texto' }}
            className="text-marrom-escuro leading-relaxed text-justify"
          >
            Agroindústria de cacau, aqui na Amazônia o cacau encontra seu lar
            perfeito. Cultivamos o fruto que da vida aos nossos produtos.
            Silvania&apos;S cacau nasce do encontro entre o cultivo com a arte
            de transformar! cada produto respeita o fruto, valoriza a
            biodiversidade e entrega chocolate de verdade, intenso, cremoso e
            cheio de história.
          </p>

          {/* Imagem 2 — chocolate/cacau aberto (paisagem) */}
          <div
            style={{ gridArea: 'img2' }}
            className="relative w-full aspect-video rounded-2xl overflow-hidden"
          >
            <Image
              src="/images/imagem-quem-somos-1.png"
              alt="Chocolate, manteiga de cacau e amêndoas de cacau"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}