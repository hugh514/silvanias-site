import Image from 'next/image'

export default function Hero() {
  return (
    <section className="bg-branco-falso px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Coluna de texto (logo + título + descrição + botão) */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 w-full">
          {/*
            INSERIR LOGO AQUI
            Coloque o arquivo em: public/images/logo.png
            (mesmo arquivo já usado na tela de login)
          */}
          <Image
            src="/images/logo.png"
            alt="Silvania's Cacau"
            width={280}
            height={280}
            className="w-52 md:w-64 h-auto"
            priority
          />

          <h1 className="text-3xl md:text-4xl font-medium text-marrom-escuro leading-tight">
            Chocolates artesanais que dão água na boca
          </h1>

          {/* Imagem de destaque — só aparece aqui no mobile, entre título e descrição */}
          <div className="md:hidden relative w-full max-w-xs aspect-square bg-branco rounded-2xl shadow-sm">
            {/*
              INSERIR FOTO DE DESTAQUE AQUI
              Coloque o arquivo em: public/images/hero-produto.png
            */}
            <Image
              src="/images/hero-produto.png"
              alt="Chocolate Silvania's Cacau"
              fill
              className="object-contain p-6"
              priority
            />
          </div>

          <p className="text-marrom-escuro/80 max-w-md">
            Todos os produtos de Silvania&apos;S cacau são desenvolvidos com
            cacau próprio, garantindo origem, qualidade e total
            rastreabilidade do cultivo à produção.
          </p>

           <a
            href="#catalogo"
            className="bg-marrom-escuro hover:bg-marrom text-branco font-medium px-8 py-3.5 rounded-xl transition-colors">
         
            Ver catálogo
          </a>
        </div>

        {/* Imagem de destaque — só aparece aqui no desktop, ao lado do texto */}
        <div className="hidden md:block relative flex-1 max-w-lg aspect-square bg-branco rounded-2xl shadow-sm">
          {/* Mesma imagem do bloco mobile acima */}
          <Image
            src="/images/hero-produto.png"
            alt="Chocolate Silvania's Cacau"
            fill
            className="object-contain p-10"
          />
        </div>
      </div>
    </section>
  )
}