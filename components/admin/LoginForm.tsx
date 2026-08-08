'use client'

import { useActionState, useState } from 'react'
import { Icon } from '@iconify/react'

import { entrar, type ResultadoEntrada } from '@/lib/actions/auth'

/**
 * Formulário de entrada.
 *
 * Antes de 2026-07-25 chamava `signInWithPassword` diretamente do navegador, sem
 * qualquer limitação de tentativas — nada travava um automatismo a experimentar
 * palavras-passe.
 *
 * Agora a autenticação passa por uma ação de servidor, que conta as tentativas
 * falhadas por origem antes de sequer tentar autenticar.
 *
 * A aparência mantém-se igual.
 */
export default function LoginForm() {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [estado, acao, pendente] = useActionState<ResultadoEntrada | null, FormData>(
    entrar,
    null
  )

  const erro = estado && !estado.ok ? estado.erro : ''

  return (
    <form action={acao} className="w-full flex flex-col items-center">
      <h1 className="hidden md:block text-3xl font-bold text-preto mb-8">
        LOGIN
      </h1>
      <h1 className="md:hidden text-xl font-bold text-preto mb-4">
        Login
      </h1>

      <div className="w-full flex flex-col gap-4">
        <label className="flex items-center gap-3 bg-branco-falso rounded-lg px-4 py-3 shadow-inner">
          <Icon icon="mdi:email-outline" className="text-marrom-claro text-xl shrink-0" />
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="bg-transparent outline-none w-full text-preto placeholder:text-cor-pele"
          />
        </label>

        <label className="flex items-center gap-3 bg-branco-falso rounded-lg px-4 py-3 shadow-inner">
          <Icon icon="mdi:lock-outline" className="text-marrom-claro text-xl shrink-0" />
          <input
            type={mostrarSenha ? 'text' : 'password'}
            name="senha"
            placeholder="Senha"
            autoComplete="current-password"
            required
            className="bg-transparent outline-none w-full text-preto placeholder:text-cor-pele"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            className="text-marrom-claro text-xl shrink-0"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Icon icon={mostrarSenha ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} />
          </button>
        </label>
      </div>

      {erro && (
        <p className="text-sm text-red-600 mt-3 self-start" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="mt-8 bg-marrom-escuro hover:bg-marrom text-branco font-medium px-10 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pendente ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
