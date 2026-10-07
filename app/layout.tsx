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

export const metadata: Metadata = {
  title: "Silvania's Cacau",
  description:
    'Chocolates e derivados de cacau artesanais, feitos com cacau próprio da Amazônia.',
  icons: { icon: '/images/icon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}