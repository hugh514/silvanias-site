import Image from 'next/image'
import Link from 'next/link'

/**
 * Layout único para "página não encontrada" e "algo deu errado".
 * O número grande é o "tchan": no 404 o zero é um grão de cacau; no erro, uma
 * barra de chocolate partida. Sem dados do servidor — funciona dentro de um
 * limite de erro (componente de cliente).
 */

function GraoDeCacau() {
  return (
    <svg viewBox="0 0 120 170" className="grao h-[0.82em] w-auto inline-block align-[-0.04em]" aria-hidden="true">
      <defs>
        <radialGradient id="casca" cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#9a5a36" />
          <stop offset="0.55" stopColor="#603116" />
          <stop offset="1" stopColor="#351503" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="85" rx="50" ry="78" fill="url(#casca)" />
      <path d="M60 12 C 48 50, 72 115, 60 158" fill="none" stroke="#2a1002" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="42" cy="52" rx="10" ry="22" fill="#fff" opacity="0.12" transform="rotate(-12 42 52)" />
    </svg>
  )
}

function BarraPartida() {
  const quadrados = (x0: number) =>
    [0, 1, 2].flatMap((c) =>
      [0, 1].map((l) => (
        <rect key={`${x0}-${c}-${l}`} x={x0 + 8 + c * 34} y={8 + l * 34} width="28" height="28" rx="4" fill="#4a1f08" />
      ))
    )
  return (
    <svg viewBox="0 0 250 100" className="w-64 md:w-80 h-auto" aria-hidden="true">
      <g className="pedaco-esq">
        <path d="M4 6 Q4 2 8 2 H112 L100 30 L118 52 L104 98 H8 Q4 98 4 94 Z" fill="#603116" />
        <g clipPath="url(#corte-esq)">{quadrados(0)}</g>
      </g>
      <g className="pedaco-dir">
        <path d="M124 2 H242 Q246 2 246 6 V94 Q246 98 242 98 H116 L130 52 L112 30 Z" fill="#603116" />
        <g clipPath="url(#corte-dir)">{quadrados(104)}</g>
      </g>
      <defs>
        <clipPath id="corte-esq">
          <path d="M4 2 H112 L100 30 L118 52 L104 98 H4 Z" />
        </clipPath>
        <clipPath id="corte-dir">
          <path d="M124 2 H246 V98 H116 L130 52 L112 30 Z" />
        </clipPath>
      </defs>
      <circle cx="115" cy="88" r="2.5" fill="#603116" className="farelo" />
      <circle cx="108" cy="94" r="1.8" fill="#603116" className="farelo" />
      <circle cx="122" cy="96" r="1.5" fill="#603116" className="farelo" />
    </svg>
  )
}

type Props = {
  tipo: '404' | 'erro'
  titulo: string
  texto: string
  children: React.ReactNode
}

export default function PaginaAviso({ tipo, titulo, texto, children }: Props) {
  return (
    <main className="min-h-screen bg-branco-falso flex flex-col items-center px-6 py-10">
      <Link href="/" aria-label="Silvania's Cacau — início">
        <Image src="/images/logo.png" alt="Silvania's Cacau" width={150} height={112} className="h-14 w-auto" priority />
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-xl py-12">
        {tipo === '404' ? (
          <p className="font-titulo font-semibold text-marrom-escuro text-[7rem] md:text-[10rem] leading-none tracking-tight" aria-hidden="true">
            4<GraoDeCacau />4
          </p>
        ) : (
          <BarraPartida />
        )}

        <span className="text-xs font-medium uppercase tracking-[0.18em] text-cor-pele">
          {tipo === '404' ? 'Página não encontrada' : 'Algo deu errado'}
        </span>
        <h1 className="font-titulo text-3xl md:text-4xl font-medium text-marrom-escuro text-balance">{titulo}</h1>
        <p className="text-marrom-escuro/75 leading-relaxed">{texto}</p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">{children}</div>
      </div>
    </main>
  )
}

export const classeBotaoPrimario =
  'inline-flex items-center gap-2 bg-marrom-escuro hover:bg-marrom text-branco font-medium px-7 py-3.5 rounded-full transition-colors'
export const classeBotaoSecundario =
  'inline-flex items-center gap-2 border border-marrom-escuro/30 hover:border-marrom-escuro text-marrom-escuro font-medium px-7 py-3.5 rounded-full transition-colors'
