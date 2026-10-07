import Image from 'next/image'

const VALORES = [
  { titulo: 'Origem', texto: 'Cacau cultivado por nós, na Amazônia.' },
  { titulo: 'Respeito ao fruto', texto: 'Produção que valoriza a biodiversidade.' },
  { titulo: 'Chocolate de verdade', texto: 'Intenso, cremoso e cheio de história.' },
]

export default function QuemSomos() {
  return (
    <section id="quem-somos" className="bg-branco-falso px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="relative aspect-4/5 w-full rounded-3xl overflow-hidden">
          <Image
            src="/images/imagem-quem-somos-2-v2.png"
            alt="Pé de cacau carregado de frutos na Amazônia"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-6">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">Quem somos</span>
          <h2 className="font-titulo text-3xl md:text-5xl font-medium text-marrom-escuro leading-tight">
            Aqui na Amazônia o cacau encontra seu lar
          </h2>
          <p className="text-marrom-escuro/80 leading-relaxed md:text-lg">
            Somos uma agroindústria de cacau. Cultivamos o fruto que dá vida aos nossos produtos, e a Silvania&apos;s
            Cacau nasce desse encontro entre o cultivo e a arte de transformar.
          </p>

          <ul className="grid sm:grid-cols-3 gap-4 pt-2">
            {VALORES.map((v) => (
              <li key={v.titulo} className="rounded-2xl bg-branco p-4">
                <p className="font-medium text-marrom-escuro">{v.titulo}</p>
                <p className="text-sm text-marrom-escuro/70 mt-1">{v.texto}</p>
              </li>
            ))}
          </ul>

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden">
            <Image
              src="/images/imagem-quem-somos-1-v2.png"
              alt="Chocolate, manteiga de cacau e amêndoas de cacau"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
