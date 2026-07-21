import CatalogoSection from '@/components/vitrine/CatalogoSection'
import Hero from '@/components/vitrine/Hero'
import Marquee from '@/components/vitrine/Maquee'
import OndeNosEncontrar from '@/components/vitrine/OndeNosEncontrar'
import QuemSomos from '@/components/vitrine/QuemSomos'
import Rodape from '@/components/vitrine/Rodape'

export default function VitrinePage() {
    const anoAtual = new Date().getFullYear()
  return (
    <main>
        <Hero />
        <Marquee />
        <CatalogoSection />
        <QuemSomos />
        <OndeNosEncontrar />
        <Rodape />      
         <p className="text-branco text-sm bg-rodape px-3 py-2">
         {`©${anoAtual} Silvania's Cacau. Todos os direitos reservados.`}
        </p>
    </main>
  )
}