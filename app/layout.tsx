import type { Metadata } from 'next'
import { Fraunces, Poppins } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-fraunces',
})

const urlSite = process.env.NEXT_PUBLIC_SITE_URL || 'https://silvanias-site.vercel.app'
const descricaoSite =
  'Chocolates e derivados de cacau artesanais, feitos com cacau próprio da Amazônia.'

export const metadata: Metadata = {
  metadataBase: new URL(urlSite),
  title: {
    default: "Silvania's Cacau — Chocolates artesanais da Amazônia",
    template: "%s | Silvania's Cacau",
  },
  description: descricaoSite,
  icons: { icon: '/images/icon.svg' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: "Silvania's Cacau",
    title: "Silvania's Cacau — Chocolates artesanais da Amazônia",
    description: descricaoSite,
    images: ['/images/hero-v3.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/hero-v3.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${poppins.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}