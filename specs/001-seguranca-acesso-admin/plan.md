# Implementation Plan: Segurança de Acesso ao Painel Administrativo

**Branch**: `001-seguranca-acesso-admin` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-seguranca-acesso-admin/spec.md`

## Summary

Fechar a cadeia de ataque confirmada em produção a 2026-07-25, pela qual qualquer pessoa
podia criar conta e obter poder de escrita sobre o catálogo.

A abordagem central saiu da pesquisa e alterou a forma do plano: **as migrações de base de
dados são retrocompatíveis com o código atual**. As escritas do painel partem hoje do
navegador com o token da dona; assim que ela constar da lista de administradores, as
políticas novas aceitam exatamente as mesmas escritas e recusam as de toda a gente. Isso
permite fechar a brecha num primeiro passo pequeno, isolado e reversível, e migrar o
código para Server Actions depois, sem janela de exposição e sem pressa.

O trabalho divide-se em duas metades de natureza diferente: uma correção de configuração e
políticas que fecha o buraco em horas, e uma reorganização de código que garante que ele
não reabre.

## Technical Context

**Language/Version**: TypeScript 5 em modo `strict`, Node 24.13.0

**Primary Dependencies**: Next.js 16.2.10 (App Router), React 19.2.4 com React Compiler,
Tailwind CSS 4, `@supabase/ssr` 0.12.1, `@supabase/supabase-js` 2.110.3

**A acrescentar**: `server-only` 0.0.1, `zod` 4.4.3, `vitest` 4.1.10,
`@playwright/test` 1.62.0, `supabase` 2.109.1 (linha de comandos, só em desenvolvimento)

**Storage**: Supabase — Postgres com segurança ao nível da linha, Auth, e um contentor de
armazenamento público chamado `produtos`

**Testing**: Vitest para unitário e integração; Playwright para percurso completo. Não
existe nenhum teste hoje.

**Target Platform**: web, servido pela Vercel; visitantes maioritariamente em telemóvel

**Project Type**: aplicação web única, App Router, sem separação cliente/servidor em
repositórios distintos

**Performance Goals**: LCP abaixo de 2,5 s em rede móvel 4G. O plano **melhora** este
número ao retirar o middleware do caminho de todas as páginas públicas, onde hoje faz uma
chamada de rede desnecessária ao serviço de autenticação em cada visita.

**Constraints**: o site público não pode parar em momento algum; nenhum teste automatizado
pode apontar para o projeto de produção; a interface mantém-se visualmente inalterada nesta
fase.

**Scale/Scope**: uma administradora, dezenas de produtos, tráfego de vitrine local. A
escala pequena é uma decisão de projeto relevante — justifica escolher simplicidade em vez
de infraestrutura, como em D2.

## Constitution Check

*GATE: verificado antes da Fase 0 e reavaliado após a Fase 1.*

Gates derivados de `.specify/memory/constitution.md` v1.0.0.

| # | Princípio | Gate | Estado |
|---|-----------|------|--------|
| I | Segurança por Omissão | Nenhuma mutação parte do navegador; `admin.ts` só em Server Actions; políticas por comando; autorização por lista explícita | **PASS** — é literalmente o objeto desta feature. Os passos B2 e B5 tratam da fronteira de segredos e da migração das escritas; o A1 substitui a política `FOR ALL` por quatro por comando |
| II | O Cliente Vê Primeiro | Peso justificado; LCP < 2,5 s; conteúdo 3D adiado; animações com preferência de movimento reduzido; acessibilidade AA | **PASS** — nenhuma secção nova; nenhum conteúdo tridimensional nesta fase; restringir o middleware a `/admin` reduz o trabalho por visita à vitrine |
| III | Validação na Fronteira | Um esquema por entidade partilhado; servidor revalida; envios validados no servidor e no contentor | **PASS** — `lib/schemas/produto.ts` partilhado; validação por assinatura de conteúdo em D8; limites configurados no contentor por FR-016 |
| IV | Uma Fonte de Verdade | Tipos gerados; símbolos de estilo no tema; interface partilhada; constantes centralizadas | **PASS parcial** — os tipos gerados eliminam as cinco redefinições do tipo de produto. Os componentes de interface partilhados e a limpeza de estilos pertencem à Fase 2 e não regridem aqui |
| V | Feedback Honesto | Sem diálogos nativos; estados visíveis; ficheiros de erro e carregamento por rota; mensagens em português sem detalhes internos | **PASS parcial** — as ações passam a devolver erros estruturados em português (FR-029) e o estado de submissão passa a explícito. Os ficheiros de erro e carregamento, e a remoção do diálogo nativo em `UploadFotos.tsx:34`, entram nesta fase por serem baratos e estarem no caminho já tocado |
| VI | Mudança Verificada | Proporção 30/50/20; toda a alteração de acesso prova que o não autorizado é **negado**; integração contínua com análise, construção e testes | **PASS** — a suite de regressão reproduz os seis passos da cadeia de ataque. É o critério de aceitação central, não um extra |

**Resultado**: sem violações. A secção Complexity Tracking fica vazia.

**Reavaliação após a Fase 1**: mantém-se. O desenho não introduziu abstração nova além de
`lib/actions/`, `lib/schemas/`, `lib/upload/` e `types/`, exigidas pelos princípios I, III
e IV. Nenhuma dependência foi acrescentada sem justificação registada em D9.

## Project Structure

### Documentation (this feature)

```text
specs/001-seguranca-acesso-admin/
├── plan.md                     # Este ficheiro
├── spec.md                     # Especificação
├── research.md                 # Fase 0 — nove decisões técnicas
├── data-model.md               # Fase 1 — entidades e regras de acesso
├── quickstart.md               # Fase 1 — como validar
├── contracts/
│   ├── server-actions.md       # Contratos das ações de servidor
│   └── politicas-acesso.md     # Matriz de quem pode fazer o quê
└── checklists/
    └── requirements.md         # Validação da especificação
```

### Source Code (repository root)

```text
supabase/
└── migrations/                     # NOVO — migrações versionadas
    ├── 0001_admins_e_is_admin.sql
    ├── 0002_politicas_produtos.sql
    ├── 0003_limites_e_politicas_storage.sql
    └── 0004_tentativas_login.sql

lib/
├── supabase/
│   ├── client.ts                   # inalterado — navegador, chave publicável
│   ├── server.ts                   # ALTERADO — passa a chave publicável + cookies
│   ├── admin.ts                    # NOVO — chave de serviço, com `server-only`
│   └── proxy.ts                    # ALTERADO — verifica administrador
├── actions/                        # NOVO
│   ├── produtos.ts                 # criar, atualizar, remover
│   └── auth.ts                     # entrar, sair, com limitação de tentativas
├── schemas/                        # NOVO
│   └── produto.ts                  # esquema partilhado cliente/servidor
├── upload/                         # NOVO
│   └── validar-imagem.ts           # assinatura de conteúdo, nome gerado
└── constants.ts                    # inalterado

types/
└── database.ts                     # NOVO — gerado do esquema

app/
├── admin/
│   ├── error.tsx                   # NOVO
│   ├── loading.tsx                 # NOVO
│   └── ...                         # páginas existentes, ajustadas
├── produtos/[id]/
│   ├── error.tsx                   # NOVO
│   └── loading.tsx                 # NOVO
└── ...

components/admin/
├── LoginForm.tsx                   # ALTERADO — usa ação de servidor
├── ProdutoForm.tsx                 # ALTERADO — deixa de falar com o Supabase
└── UploadFotos.tsx                 # ALTERADO — sem diálogo nativo

tests/
├── unit/                           # NOVO — esquemas, assinatura de imagem
├── integration/                    # NOVO — políticas de acesso, ações
│   └── acesso-negado.test.ts       # a suite que prova a negação
└── e2e/                            # NOVO — percursos críticos

proxy.ts                            # ALTERADO — alcance restrito a /admin
next.config.ts                      # ALTERADO — cabeçalhos
.github/workflows/ci.yml            # NOVO
```

**Structure Decision**: mantém-se a estrutura de aplicação única do App Router já em uso.
As pastas novas em `lib/` separam por responsabilidade e não por camada arquitetural —
`actions`, `schemas`, `upload` — o que é proporcional a um projeto deste tamanho. Não se
introduz camada de repositório nem de serviço: seria abstração sem problema
correspondente, e a governança da constituição manda responder não por omissão a essa
pergunta.

## Faseamento da Execução

Justificação completa em [research.md](./research.md), decisão D1.

### Etapa A — Fechar a brecha (independente, reversível, prioridade máxima)

| Passo | Natureza | Depende de |
|-------|----------|------------|
| A0 | Manual, pela dona: fechar o registo público na consola de autenticação | Nada. Fazer já |
| A1 | Migrações 0001 a 0003 | Nada |
| A2 | Reexecutar as sondas da auditoria e confirmar que a cadeia deixou de reproduzir | A1 |

No fim da Etapa A a vulnerabilidade está fechada e o painel continua a funcionar **sem uma
única linha de TypeScript alterada**. Esta etapa entrega valor sozinha e é a que importa
concluir hoje.

### Etapa B — Garantir que não reabre

| Passo | Natureza | Depende de |
|-------|----------|------------|
| B1 | Instalar dependências; gerar tipos; eliminar as cinco redefinições do tipo de produto | A1 |
| B2 | `server-only` e separação `server.ts` / `admin.ts` | B1 |
| B3 | Autorização no proxy, alcance restrito a `/admin` | B2 |
| B4 | Esquema de validação e validação de imagem por assinatura | B1 |
| B5 | Ações de servidor de produto; o formulário deixa de falar com o Supabase | B2, B4 |
| B6 | Migração 0004 e ação de entrada com limitação de tentativas | B2 |
| B7 | Ficheiros de erro e carregamento; remoção do diálogo nativo | B5 |
| B8 | Cabeçalhos, política de origens em modo de observação | — |
| B9 | Testes: unitário, integração, e a suite de negação | B5, B6 |
| B10 | Integração contínua | B9 |

### Etapa C — Consolidar

| Passo | Natureza | Depende de |
|-------|----------|------------|
| C1 | Após o período de observação, passar a política de origens a modo de bloqueio | B8 e tráfego real |

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| O ambiente local de base de dados não sobe — o serviço de contentores não está acessível nesta máquina | **Alta** | Médio | Recuar para projeto dedicado de testes sem hesitar (D7). Limite: uma hora de tentativa |
| A política de origens parte o mapa, os ícones ou a recolha de estatísticas | Média | Alto para o visitante | Modo de observação antes de bloqueio (D6). Nunca publicar em bloqueio sem dados |
| A dona fica sem acesso por engano durante a migração | Baixa | Alto | A migração insere-a na lista no mesmo ficheiro que cria a lista. Procedimento de recuperação documentado no arranque rápido |
| Restringir o middleware a `/admin` quebra a renovação de sessão | Baixa | Baixo | O site público não usa sessão. Cobrir com teste de percurso completo |
| Os limites de tipo no contentor recusam formatos já em uso | Baixa | Médio | O formulário aceita hoje `image/*`, que inclui GIF e SVG. A restrição é deliberada — SVG num contentor público é vetor de execução de código no domínio da marca. Confirmar com a dona que não tem fotos nesses formatos |
| A dependência de ícones em tempo de execução entra em conflito com a política de origens | Média | Baixo | Incluir `api.iconify.design` nas origens permitidas nesta fase. Substituir por ícones locais é candidato à Fase 2, registado em D6 |

## Complexity Tracking

> Preencher apenas se o Constitution Check tiver violações que exijam justificação.

Sem violações. Nenhuma entrada.
