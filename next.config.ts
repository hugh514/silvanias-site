import path from 'node:path'

import type { NextConfig } from 'next'

/**
 * Domínio do Supabase, derivado do ambiente em vez de repetido à mão.
 * O valor de recurso mantém o comportamento anterior caso a variável falte.
 */
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  } catch {
    return 'https://khfebjavstjyzfhxwmvm.supabase.co'
  }
})()

/**
 * Política de origens de recursos.
 *
 * Origens levantadas do código a 2026-07-25 (decisão D6):
 *   - mapa embutido do Google  → OndeNosEncontrar.tsx
 *   - imagens do Supabase      → fotos de produto
 *   - api.iconify.design       → @iconify/react vai buscar CADA ícone em tempo
 *                                de execução, no navegador do visitante. Está em
 *                                nove ficheiros. É um terceiro no caminho crítico
 *                                de renderização e candidato a substituição por
 *                                ícones locais numa fase seguinte
 *   - va.vercel-scripts.com    → recolha de estatísticas de visita
 *
 * Ligações para wa.me e instagram.com são navegação por hiperligação, não
 * carregamento de recursos — não precisam de diretiva.
 *
 * 'unsafe-inline' em script-src é necessário enquanto não houver nonces por
 * pedido. É precisamente o tipo de coisa que o período de observação existe para
 * medir antes de apertar.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE_HOST}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_HOST} ${SUPABASE_HOST.replace('https://', 'wss://')} https://api.iconify.design https://va.vercel-scripts.com`,
  'frame-src https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Em dev local o Supabase é http://127.0.0.1 — não forçar https nesse caso.
  ...(SUPABASE_HOST.startsWith('https://') ? ['upgrade-insecure-requests'] : []),
].join('; ')

const nextConfig: NextConfig = {
  // Existe um package-lock.json em /home/uinternet que confundia a deteção da
  // raiz do espaço de trabalho e fazia o Turbopack escolher a pasta errada.
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  images: {
    remotePatterns: [
      {
        protocol: new URL(SUPABASE_HOST).protocol.replace(':', '') as 'http' | 'https',
        hostname: new URL(SUPABASE_HOST).hostname,
        port: new URL(SUPABASE_HOST).port,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // MODO DE OBSERVAÇÃO. Reporta violações sem bloquear nada.
          // Passar a `Content-Security-Policy` (T063) só depois de analisar o que
          // o tráfego real reportar. Publicar em bloqueio sem dados parte o site
          // em silêncio para o visitante, sem erro visível a quem programa.
          { key: 'Content-Security-Policy-Report-Only', value: CSP },

          // FR-022 — só por ligação segura, incluindo subdomínios.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // Impede o navegador de adivinhar o tipo de conteúdo. Relevante num
          // site que serve ficheiros carregados por utilizadores.
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // FR-023 — não ser embutido em páginas de terceiros.
          // Duplica `frame-ancestors` acima, para navegadores antigos.
          { key: 'X-Frame-Options', value: 'DENY' },

          // FR-025 — não vazar o caminho completo para terceiros.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Nada disto é usado pelo site. Negar por omissão.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
