# Implementation Plan: Painel, Conteúdo do Site e SEO

**Branch**: `002-painel-conteudo-seo` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-painel-conteudo-seo/spec.md`

## Summary

Tornar o painel diário da dona utilizável (shell com sidebar, tabela de produtos com
ordem/destaque) e tornar editável o conteúdo institucional da vitrine via
`conteudo_site`, ligando os componentes RSC existentes a essa fonte — sem redesign nem
motion. Completar SEO básico (metadataBase, OG/Twitter, `generateMetadata` na PDP,
sitemap, robots). Escritas continuam só em Server Actions com `is_admin()`; CMS usa
`createAdminClient` após essa verificação. Feedback via Sonner; formulários com
`useActionState`.

## Technical Context

**Language/Version**: TypeScript 5 em modo `strict`, Node 24+

**Primary Dependencies**: Next.js 16.2.x (App Router), React 19.2.x com React Compiler,
Tailwind CSS 4, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `server-only`

**A acrescentar**: primitives shadcn/ui em `components/ui/`, `@tanstack/react-table`,
`sonner`, peers habituais do shadcn (`class-variance-authority`, `clsx`,
`tailwind-merge`, `lucide-react` conforme o CLI)

**Storage**: Supabase Postgres — estender `public.produtos`; criar
`public.conteudo_site` com RLS

**Testing**: Vitest (unitário + integração) e Playwright (E2E); preservar suites `001`

**Target Platform**: web na Vercel; visitantes maioritariamente em telemóvel

**Project Type**: aplicação web única, App Router, raiz do repositório (sem `src/`)

**Performance Goals**: LCP < 2,5 s em 4G; sem canvas 3D nem motion novo nesta fase

**Constraints**: vitrine visualmente inalterada; sem React Query/Zustand; sem `alert()`;
migrações `0005` e `0006`; writes CMS só via Server Actions + admin client após
`is_admin`

**Scale/Scope**: 1 administradora, dezenas de produtos, 5 documentos CMS, tráfego de
vitrine local

## Constitution Check

*GATE: verificado antes da Fase 0 e reavaliado após a Fase 1.*

Gates derivados de `.specify/memory/constitution.md` v1.0.0.

| # | Princípio | Gate | Estado |
|---|-----------|------|--------|
| I | Segurança por Omissão | Nenhuma mutação parte do browser; `admin.ts` só em Server Actions; policies por comando; allowlist `is_admin()` | **PASS** — produtos continuam via actions existentes (estendidas); CMS: action verifica `is_admin` e só então `createAdminClient`; RLS SELECT público / mutação só `is_admin()`; testes de negação obrigatórios |
| II | O Cliente Vê Primeiro | Peso justificado; LCP < 2,5 s; 3D lazy; reduced motion; AA | **PASS** — sem secções visuais novas na landing; CMS troca fonte de dados RSC, não o layout; sem GSAP/Three/Framer; tabela admin é chrome interno, não peso público |
| III | Validação na Fronteira | Um schema zod por entidade; servidor revalida | **PASS** — `produtoSchema` ganha `ordem`/`destaque`; schemas por chave CMS em `lib/schemas/conteudo-site.ts`; actions revalidam sempre |
| IV | Uma Fonte de Verdade | Tipos gerados; UI em `components/ui/`; constantes centralizadas | **PASS** — regenerar `types/database.ts` após migrações; shadcn em `components/ui/`; `NUMEROZAP` permanece em `lib/constants.ts` como fallback |
| V | Feedback Honesto | Sem `alert()`; loading/erro/sucesso; error/loading por rota; PT-BR | **PASS** — Sonner em saves; `useActionState` nos forms; rotas novas de conteúdo com `loading`/`error` herdados do layout admin ou ficheiros locais |
| VI | Mudança Verificada | ~30/50/20; RLS com teste de **negação**; CI | **PASS** — unit schemas; integration deny + RLS CMS; E2E admin+CMS+SEO smoke; regressão `001` preservada |

**Resultado**: sem violações. Complexity Tracking vazio — TanStack Table e shadcn são
proporcionais ao problema da listagem (D2); `jsonb` evita over-modelling (D1).

**Reavaliação após a Fase 1 (desenho)**: mantém-se PASS. Contratos e data-model não
introduzem repositórios nem camadas extra; leitura CMS na vitrine é fetch direto no
RSC.

## Project Structure

### Documentation (this feature)

```text
specs/002-painel-conteudo-seo/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   ├── server-actions-cms.md
│   └── conteudo-site.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root — alvos desta feature)

```text
supabase/migrations/
├── 0005_ordem_destaque.sql          # NOVO
└── 0006_conteudo_site.sql           # NOVO — tabela, RLS, seed

lib/
├── schemas/
│   ├── produto.ts                   # ALTERADO — ordem, destaque
│   └── conteudo-site.ts             # NOVO — zod por chave
├── actions/
│   ├── produtos.ts                  # ALTERADO — persistir ordem/destaque; toast-friendly
│   └── conteudo-site.ts             # NOVO — ler (opcional) / upsert por chave
├── conteudo/                        # NOVO (opcional) helpers de leitura tipada para RSC
│   └── carregar-conteudo.ts
└── constants.ts                     # inalterado — NUMEROZAP fallback

components/
├── ui/                              # NOVO — primitives shadcn
├── admin/
│   ├── ProdutosGrid.tsx             # SUBSTITUÍDO / reescrito → Data Table
│   ├── ProdutoForm.tsx              # ALTERADO — ordem, destaque, sonner
│   ├── ConteudoSiteForm.tsx         # NOVO
│   └── AdminSidebar.tsx             # NOVO
└── vitrine/
    ├── Hero.tsx                     # ALTERADO — props/dados de conteudo_site
    ├── Maquee.tsx                   # ALTERADO
    ├── QuemSomos.tsx                # ALTERADO
    ├── OndeNosEncontrar.tsx         # ALTERADO
    ├── Rodape.tsx                   # ALTERADO — whatsapp_url com fallback
    ├── CatalogoSection.tsx          # ALTERADO — order ordem ASC, created_at DESC; destaque
    └── ProdutoCardVitrine.tsx       # ALTERADO — badge destaque (mínimo)

app/
├── layout.tsx                       # ALTERADO — metadataBase, OG, twitter
├── sitemap.ts                       # NOVO
├── robots.ts                        # NOVO
├── produtos/[id]/
│   └── page.tsx                     # ALTERADO — generateMetadata
└── admin/
    ├── layout.tsx                   # NOVO — shell + sidebar
    ├── conteudo/
    │   └── page.tsx                 # NOVO
    └── produtos/...                 # SELECT inclui ordem/destaque

exemple.env                          # ALTERADO — NEXT_PUBLIC_SITE_URL
types/database.ts                    # REGENERADO

tests/
├── unit/
│   ├── produto-schema.test.ts       # ALTERADO
│   └── conteudo-site-schema.test.ts # NOVO
├── integration/
│   ├── acesso-negado.test.ts        # ESTENDER ou ficheiro irmão CMS
│   └── conteudo-site-rls.test.ts    # NOVO
└── e2e/
    ├── painel-crud.spec.ts          # ESTENDER — ordem/destaque + toast
    ├── conteudo-site.spec.ts        # NOVO — edit CMS → visível em /
    └── seo.spec.ts                  # NOVO — sitemap/robots/meta smoke
```

**Structure Decision**: mantém app única na raiz. Sem camada de repositório. Helpers
mínimos de leitura CMS só se reduzirem duplicação entre RSC.

## Faseamento da Execução

Ordem alinhada a [tasks.md](./tasks.md) e às prioridades P1–P4.

| Fase | Conteúdo | Entrega testável |
|------|----------|------------------|
| Setup | deps shadcn, TanStack Table, sonner | build com UI primitives |
| Fundações | migrações 0005/0006 + testes deny/RLS (TDD) | vermelho→verde nas policies |
| US1 | ordem/destaque em schema, actions, catálogo público | SC-001/002 |
| US2 | admin layout + Data Table + forms/toasts | shell navegável |
| US3 | actions CMS + página admin + wire vitrine | SC-004/005 |
| US4 | SEO metadata, sitemap, robots, exemple.env | SC-007/008 |
| Polish | E2E completos, regressão 001, LCP smoke | SC-009/010 |

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Seed CMS diverge do copy visual atual | Média | Médio (regressão de texto) | Extrair strings literais dos componentes no momento da migração; E2E compara título hero seed |
| `OndeNosEncontrar` é client component — dados CMS precisam de props do pai RSC | Média | Baixo | Page/section server passa props; client só para estado do iframe |
| Admin layout envolve `/admin/login` com sidebar | Média | Médio UX | Excluir segmento login do chrome (route group `(painel)` ou early return) |
| `createAdminClient` importado por engano em client | Baixa | Alto | Suite `fronteira-segredos` da 001 + novo ficheiro action só server |
| Regeneração de tipos esquecida após migração | Média | Médio | Task explícita `db:types` no tasks.md |

## Complexity Tracking

> Vazio — nenhuma violação constitucional a justificar.
