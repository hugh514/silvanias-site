import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: "Silvania's Cacau",
  description: 'Chocolate artesanal',

  icons: {
    icon: '/images/icon.svg',   
    shortcut: '/images/logo-aba.svg',
    apple: '/images/logo-aba.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={poppins.variable}>
        {children}
      </body>
    </html>
  )
}