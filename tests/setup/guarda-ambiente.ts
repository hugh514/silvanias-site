/**
 * T007 — Salvaguarda de ambiente.
 *
 * Os testes de integração criam utilizadores, escrevem produtos e enviam ficheiros.
 * Correr isto contra produção destruiria o catálogo do negócio.
 *
 * Este ficheiro corre antes de qualquer teste de integração e aborta o processo se
 * detetar o projeto de produção. Falha fechado: na dúvida, recusa.
 */

/**
 * Projetos Supabase de PRODUÇÃO. Nunca devem ser alvo de testes.
 * `khfeb…` é o antigo; `dcfs…` é o atual (o que está no `.env`).
 */
const PROJETOS_PRODUCAO = ['khfebjavstjyzfhxwmvm', 'dcfskppmsqaztnojuyhc']

function abortar(motivo: string): never {
  // Escrito diretamente em stderr: um throw dentro de setupFiles pode ser
  // engolido por um handler de erros e deixar os testes prosseguirem.
  process.stderr.write(
    '\n' +
      '━'.repeat(72) +
      '\n  TESTES ABORTADOS — SALVAGUARDA DE AMBIENTE\n' +
      `  ${motivo}\n` +
      '\n  Os testes de integração escrevem na base de dados e no armazenamento.\n' +
      '  Aponte NEXT_PUBLIC_SUPABASE_URL para o ambiente local (supabase start)\n' +
      '  ou para o projeto dedicado a testes.\n' +
      '━'.repeat(72) +
      '\n\n'
  )
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!url) {
  abortar('NEXT_PUBLIC_SUPABASE_URL não está definida.')
}

const producao = PROJETOS_PRODUCAO.find((id) => url.includes(id))
if (producao) {
  abortar(`NEXT_PUBLIC_SUPABASE_URL aponta para o projeto de PRODUÇÃO (${producao}).`)
}

if (!process.env.SUPABASE_SECRET_KEY) {
  abortar('SUPABASE_SECRET_KEY não está definida — os testes precisam dela para criar utilizadores descartáveis.')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  abortar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não está definida.')
}
