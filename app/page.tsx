import Hero from '@/components/vitrine/Hero'
import Marquee from '@/components/vitrine/Maquee'

export default function VitrinePage() {
  return (
    <main>
      <Hero />
      <Marquee />

      <section id="catalogo" className="min-h-screen bg-branco-falso" />
    </main>
  )
}