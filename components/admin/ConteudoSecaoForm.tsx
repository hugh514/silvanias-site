'use client'

import { useActionState } from 'react'

import { Icone as Icon } from '@/components/ui/Icone'
import { guardarConteudo, type ResultadoConteudo } from '@/lib/actions/conteudo-site'
import type { ChaveConteudo } from '@/lib/schemas/conteudo-site'

export type CampoConteudo = {
  nome: string
  rotulo: string
  tipo?: 'texto' | 'area' | 'numero'
  ajuda?: string
  linhas?: number
}

type Props = {
  chave: ChaveConteudo
  titulo: string
  descricao: string
  campos: CampoConteudo[]
  valores: Record<string, string | number>
}

export default function ConteudoSecaoForm({ chave, titulo, descricao, campos, valores }: Props) {
  const [estado, acao, pendente] = useActionState<ResultadoConteudo | null, FormData>(
    guardarConteudo.bind(null, chave),
    null
  )
  const erros = estado && !estado.ok ? (estado.camposComErro ?? {}) : {}
  const atuais = estado && !estado.ok && estado.enviado ? estado.enviado : valores

  return (
    // `key` remonta os campos a cada resposta, para mostrarem `atuais` (texto digitado após erro).
    <form key={JSON.stringify(atuais)} action={acao} className="bg-branco rounded-2xl shadow-sm p-5 md:p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-medium text-marrom-escuro">{titulo}</h2>
        <p className="text-sm text-marrom-escuro/60">{descricao}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => {
          const id = `${chave}-${c.nome}`
          const classe =
            'bg-branco-falso rounded-xl px-4 py-3 text-preto outline-none focus:ring-2 focus:ring-marrom-claro aria-invalid:ring-2 aria-invalid:ring-red-400'
          return (
            <div key={c.nome} className={`flex flex-col gap-1.5 ${c.tipo === 'numero' ? '' : 'sm:col-span-2'}`}>
              <label htmlFor={id} className="text-xs text-marrom-escuro">
                {c.rotulo}
              </label>
              {c.tipo === 'area' ? (
                <textarea
                  id={id}
                  name={c.nome}
                  rows={c.linhas ?? 3}
                  defaultValue={String(atuais[c.nome] ?? '')}
                  aria-invalid={!!erros[c.nome]}
                  className={`${classe} resize-y`}
                />
              ) : (
                <input
                  id={id}
                  name={c.nome}
                  type={c.tipo === 'numero' ? 'number' : 'text'}
                  step={c.tipo === 'numero' ? 'any' : undefined}
                  defaultValue={String(atuais[c.nome] ?? '')}
                  aria-invalid={!!erros[c.nome]}
                  className={classe}
                />
              )}
              {c.ajuda && <span className="text-xs text-marrom-escuro/60">{c.ajuda}</span>}
              {erros[c.nome] && <span className="text-xs text-red-600">{erros[c.nome]}</span>}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-4">
        {!pendente && estado?.ok && (
          <span role="status" className="inline-flex items-center gap-1 text-sm text-green-700">
            <Icon icon="mdi:check-circle-outline" />
            Salvo — já está no site.
          </span>
        )}
        {!pendente && estado && !estado.ok && (
          <span role="alert" className="inline-flex items-center gap-1 text-sm text-red-600">
            <Icon icon="mdi:alert-circle-outline" />
            {estado.erro}
          </span>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="px-6 py-2.5 rounded-full bg-marrom-escuro hover:bg-marrom text-branco text-sm font-medium transition-colors disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
