import Cabecalho from '@/components/vitrine/Cabecalho'
import CatalogoSection from '@/components/vitrine/CatalogoSection'
import Hero from '@/components/vitrine/Hero'
import Marquee from '@/components/vitrine/Maquee'
import OndeNosEncontrar from '@/components/vitrine/OndeNosEncontrar'
import QuemSomos from '@/components/vitrine/QuemSomos'
import Rodape from '@/components/vitrine/Rodape'

export default function VitrinePage() {
  return (
    <>
      <Cabecalho />
      <main>
        <Hero />
        <Marquee />
        <CatalogoSection />
        <QuemSomos />
        <OndeNosEncontrar />
      </main>
      <Rodape />
    </>
  )
}
