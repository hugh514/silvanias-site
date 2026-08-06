import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * T028 — a credencial de serviço não pode chegar ao navegador (FR-026, FR-028, SC-008).
 *
 * A defesa principal é o `import 'server-only'` em lib/supabase/admin.ts: se um
 * componente de cliente o importar, a CONSTRUÇÃO falha. Verificado manualmente a
 * 2026-07-25 injetando o import no LoginForm — o build parou com
 * «'server-only' cannot be imported from a Client Component module».
 *
 * Este teste existe por causa de uma limitação que essa verificação revelou:
 * o `server-only` só atua sobre ficheiros que entram mesmo no grafo do cliente.
 * Um ficheiro órfão, ainda não importado por ninguém, passa despercebido — e
 * torna-se uma bomba armadilhada para o dia em que alguém o ligar a uma página.
 *
 * A análise estática abaixo apanha-o na mesma, e corre em milissegundos.
 */

const RAIZ = path.resolve(import.meta.dirname, '../..')
const PASTAS = ['app', 'components', 'lib']
const EXTENSOES = new Set(['.ts', '.tsx'])

function listarFicheiros(dir: string): string[] {
  const encontrados: string[] = []
  for (const entrada of readdirSync(dir)) {
    if (entrada === 'node_modules' || entrada.startsWith('.')) continue
    const completo = path.join(dir, entrada)
    if (statSync(completo).isDirectory()) encontrados.push(...listarFicheiros(completo))
    else if (EXTENSOES.has(path.extname(entrada))) encontrados.push(completo)
  }
  return encontrados
}

const ficheiros = PASTAS.flatMap((p) => listarFicheiros(path.join(RAIZ, p)))

/**
 * Remove comentários antes de analisar.
 *
 * Sem isto, os comentários que DOCUMENTAM a vulnerabilidade antiga — «este
 * ficheiro usava SUPABASE_SECRET_KEY» — disparam o alarme. O teste passaria a
 * exigir que não se explicasse o bug corrigido, que é exatamente ao contrário do
 * que se quer.
 */
function semComentarios(conteudo: string): string {
  return conteudo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const ehComponenteCliente = (conteudo: string) =>
  /^\s*['"]use client['"]/m.test(conteudo)

const importaModuloAdmin = (conteudo: string) =>
  /from\s+['"](@\/lib\/supabase\/admin|\.{1,2}\/[^'"]*supabase\/admin)['"]/.test(conteudo)

describe('fronteira de segredos', () => {
  it('encontra_ficheiros_para_analisar', () => {
    // Guarda contra o teste passar por não ter examinado nada.
    expect(ficheiros.length).toBeGreaterThan(10)
  })

  it('nenhum_componente_de_cliente_importa_o_modulo_admin', () => {
    const infratores = ficheiros
      .filter((f) => {
        const conteudo = readFileSync(f, 'utf8')
        return ehComponenteCliente(conteudo) && importaModuloAdmin(conteudo)
      })
      .map((f) => path.relative(RAIZ, f))

    expect(
      infratores,
      `Estes ficheiros de navegador importam a credencial de serviço:\n  ${infratores.join('\n  ')}`
    ).toEqual([])
  })

  it('o_modulo_admin_declara_server_only_na_primeira_linha', () => {
    const conteudo = readFileSync(path.join(RAIZ, 'lib/supabase/admin.ts'), 'utf8')
    const primeiraLinhaUtil = conteudo
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0)

    expect(
      primeiraLinhaUtil,
      'lib/supabase/admin.ts perdeu o `import \'server-only\'` — a construção deixa de proteger a fronteira'
    ).toMatch(/^import\s+['"]server-only['"]/)
  })

  it('a_credencial_de_servico_so_e_lida_no_modulo_admin', () => {
    const permitidos = ['lib/supabase/admin.ts']

    const infratores = ficheiros
      .filter((f) =>
        semComentarios(readFileSync(f, 'utf8')).includes('process.env.SUPABASE_SECRET_KEY')
      )
      .map((f) => path.relative(RAIZ, f))
      .filter((f) => !permitidos.includes(f))

    expect(
      infratores,
      `SUPABASE_SECRET_KEY deve ser lida apenas em ${permitidos.join(', ')}. ` +
        `Encontrada em:\n  ${infratores.join('\n  ')}`
    ).toEqual([])
  })

  it('o_cliente_de_servidor_usa_a_chave_publicavel', () => {
    // Regressão direta do bug: até 2026-07-25 este ficheiro usava a credencial
    // de serviço, e por isso TODAS as páginas de servidor — incluindo a página
    // pública de produto — corriam com desvio às políticas de acesso.
    const codigo = semComentarios(
      readFileSync(path.join(RAIZ, 'lib/supabase/server.ts'), 'utf8')
    )

    expect(codigo).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(
      codigo.includes('process.env.SUPABASE_SECRET_KEY'),
      'lib/supabase/server.ts voltou a usar a credencial de serviço'
    ).toBe(false)
  })
})
