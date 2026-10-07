import ConteudoSecaoForm, { type CampoConteudo } from '@/components/admin/ConteudoSecaoForm'
import { carregarConteudo } from '@/lib/conteudo/carregar-conteudo'
import type { ChaveConteudo } from '@/lib/schemas/conteudo-site'

const SECOES: { chave: ChaveConteudo; titulo: string; descricao: string; campos: CampoConteudo[] }[] = [
  {
    chave: 'hero',
    titulo: 'Abertura',
    descricao: 'O primeiro bloco do site, ao lado da foto principal.',
    campos: [
      { nome: 'titulo', rotulo: 'Título' },
      { nome: 'descricao', rotulo: 'Texto', tipo: 'area' },
    ],
  },
  {
    chave: 'marquee',
    titulo: 'Faixa',
    descricao: 'A frase que passa na faixa escura abaixo da abertura.',
    campos: [{ nome: 'mensagem', rotulo: 'Frase' }],
  },
  {
    chave: 'quem_somos',
    titulo: 'Quem somos',
    descricao: 'A história da empresa.',
    campos: [
      { nome: 'titulo', rotulo: 'Título' },
      { nome: 'texto', rotulo: 'Texto', tipo: 'area', linhas: 6, ajuda: 'Pode usar quebras de linha.' },
    ],
  },
  {
    chave: 'onde_encontrar',
    titulo: 'Onde estamos',
    descricao: 'Endereço e ponto no mapa.',
    campos: [
      { nome: 'endereco', rotulo: 'Endereço', tipo: 'area', ajuda: 'Uma informação por linha.' },
      { nome: 'lat', rotulo: 'Latitude', tipo: 'numero', ajuda: 'No Google Maps: botão direito no local → copiar coordenadas.' },
      { nome: 'lng', rotulo: 'Longitude', tipo: 'numero' },
    ],
  },
  {
    chave: 'rodape',
    titulo: 'Rodapé',
    descricao: 'Frase e Instagram no fim da página.',
    campos: [
      { nome: 'frase', rotulo: 'Frase' },
      { nome: 'instagram_url', rotulo: 'Link do Instagram', ajuda: 'Ex.: https://instagram.com/silvaniascacau' },
    ],
  },
]

export default async function ConteudoPage() {
  const conteudo = await carregarConteudo()

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <header>
        <h1 className="font-titulo text-2xl md:text-3xl text-marrom-escuro">Textos do site</h1>
        <p className="text-sm text-marrom-escuro/60">Cada bloco salva separado e aparece no site na hora.</p>
      </header>

      {SECOES.map((s) => (
        <ConteudoSecaoForm key={s.chave} {...s} valores={conteudo[s.chave]} />
      ))}
    </div>
  )
}
