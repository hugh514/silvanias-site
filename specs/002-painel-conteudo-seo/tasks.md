# Tasks: Painel, Conteúdo do Site e SEO

**Feature**: `002-painel-conteudo-seo`
**Input**: [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)
**Data**: 2026-08-06

**Testes são obrigatórios** onde há schema, action ou RLS (Princípio VI). TDD: teste
que falha → código mínimo → verde. Preservar suites da `001`.

---

## Regras da Constituição (v1.0.0)

- **Teste de acesso negado obrigatório** para qualquer alteração de policy ou action de
  escrita (produtos estendidos + `conteudo_site`).
- **Fronteira de segredos**: nenhum `"use client"` importa `lib/supabase/admin.ts`.
- **Rotas novas** (`/admin/conteudo`): trio page + herança de `error`/`loading` do
  layout admin (criar locais se o layout não cobrir).
- **Sem motion novo**; sem `alert()`.

---

## Convenções

- Raiz App Router, sem prefixo `src/`.
- `[P]` = ficheiros distintos, sem dependência entre si.
- **[MANUAL]** = passo humano não automatizável.
- Ordem de execução = ordem do documento.

---

## Phase 1: Setup (shadcn + deps)

**Purpose**: tooling de UI sem alterar comportamento de produção.

- [ ] T001 Inicializar shadcn/ui no repositório (`components.json`, aliases `@/components`) alinhado a Tailwind 4 existente
- [ ] T002 [P] Acrescentar primitives em `components/ui/`: Button, Input, Label, Table, Dialog, Sheet, Textarea, Switch
- [ ] T003 [P] Instalar e configurar Sonner (`components/ui/sonner.tsx` ou toaster) e montar `<Toaster />` no layout admin (não no layout público, salvo necessidade mínima)
- [ ] T004 [P] Instalar `@tanstack/react-table` e peers shadcn necessários (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` conforme CLI)
- [ ] T005 Confirmar `npm run build` e `npm test` (suites 001) verdes após deps — **checkpoint setup**

**Checkpoint**: primitives disponíveis; regressão 001 intacta.

---

## Phase 2: Foundational — migrações + testes de negação (TDD)

**Purpose**: schema e RLS antes das UIs. **Nenhuma US de UI começa antes do verde nos
testes de policy/action deny.**

### Testes primeiro (devem falhar sem migração/action)

- [ ] T006 [P] **[US1]** Estender ou criar `tests/unit/produto-schema.test.ts`: casos `ordem`/`destaque` válidos e inválidos (ainda podem falhar se schema não estendido — escrever asserções desejadas)
- [ ] T007 [P] **[US3]** Criar `tests/unit/conteudo-site-schema.test.ts`: um caso feliz e um inválido por chave (`hero`, `marquee`, `quem_somos`, `onde_encontrar`, `rodape`)
- [ ] T008 **[US1]** **[US3]** Em `tests/integration/conteudo-site-rls.test.ts` (novo): anónimo SELECT ok; autenticado não-admin INSERT/UPDATE/DELETE `conteudo_site` negados; admin (ou service após promo) consegue upsert — **red** até T012
- [ ] T009 **[US1]** Em integração (estender `acesso-negado.test.ts` ou irmão): não-admin não atualiza `ordem`/`destaque` num produto existente — **red** se coluna ainda não existe; ajustar após T010

### Migrações

- [ ] T010 **[US1]** Criar `supabase/migrations/0005_ordem_destaque.sql`: `ordem integer NOT NULL DEFAULT 0`, `destaque boolean NOT NULL DEFAULT false`
- [ ] T011 **[US3]** Criar `supabase/migrations/0006_conteudo_site.sql`: tabela `conteudo_site`, trigger `atualizado_em`, policies por comando, seed das 5 chaves com copy de [data-model.md](./data-model.md)
- [ ] T012 Aplicar migrações no ambiente de **teste** e regenerar `types/database.ts` (`npm run db:types`)
- [ ] T013 Implementar `lib/schemas/conteudo-site.ts` até T007 verde
- [ ] T014 Confirmar T008 verde contra políticas reais; admin positivo de controlo incluído

**Checkpoint**: DB pronta; deny RLS CMS verde; tipos regenerados.

---

## Phase 3: User Story 1 — Ordem e destaque (Priority: P1) 🎯

**Goal**: catálogo público ordenado; destaque mínimo; persistência só admin.

**Independent Test**: ver quickstart §3 passos 4–5 (sem precisar do CMS).

### TDD schema + action

- [ ] T015 **[US1]** Estender `lib/schemas/produto.ts` com `ordem` e `destaque`; T006 verde
- [ ] T016 [P] **[US1]** Teste unitário/integração da ordenação: helper puro ou query asserção `ordem ASC, created_at DESC` (escrever teste antes de mudar `CatalogoSection`)
- [ ] T017 **[US1]** Estender `lib/actions/produtos.ts` (`criarProduto`/`atualizarProduto`) para persistir `ordem`/`destaque` após validação; garantir T009 verde (não-admin continua negado)
- [ ] T018 **[US1]** Alterar `components/vitrine/CatalogoSection.tsx`: `select` inclui `destaque`; `.order('ordem').order('created_at', { ascending: false })`
- [ ] T019 **[US1]** Superfície mínima de destaque em `ProdutoCardVitrine.tsx` (badge) e/ou lista curta de destacados — sem redesign
- [ ] T020 **[US1]** Atualizar `ProdutoForm.tsx` com campos ordem (Input) e destaque (Switch); wiring FormData

**Checkpoint**: US1 testável sem shell novo (form já expõe campos).

---

## Phase 4: User Story 2 — Shell admin + Data Table (Priority: P2)

**Goal**: sidebar + tabela; toasts; sem React Query/Zustand.

**Independent Test**: navegar sidebar; pesquisar na tabela; gravar produto → toast.

- [ ] T021 **[US2]** Criar `app/admin/layout.tsx` com sidebar Produtos | Conteúdo do site | Sair; **excluir** chrome em `/admin/login`
- [ ] T022 [P] **[US2]** Criar `components/admin/AdminSidebar.tsx` (links + `BotaoSair`)
- [ ] T023 **[US2]** Substituir parede de cartões: reescrever listagem com padrão Data Table (TanStack) em `components/admin/ProdutosDataTable.tsx` (ou evoluir `ProdutosGrid.tsx`); filtro/pesquisa/paginação cliente
- [ ] T024 **[US2]** Atualizar `app/admin/produtos/page.tsx` para selecionar `ordem`, `destaque` e alimentar a tabela
- [ ] T025 **[US2]** Ligar Sonner aos saves de produto (`ok: true` → toast sucesso PT-BR); remover qualquer `alert()` residual nos forms tocados
- [ ] T026 **[US2]** Garantir `useActionState` nos forms de produto tocados; prevenir duplo-submit (disabled while pending)
- [ ] T027 [P] **[US2]** Placeholder `app/admin/conteudo/page.tsx` (página mínima “em breve” ou formulário vazio) para o link da sidebar não 404 — preenchido na Phase 5

**Checkpoint**: painel navegável; tabela utilizável.

---

## Phase 5: User Story 3 — CMS CRUD (Priority: P3)

**Goal**: actions + UI de conteúdo; ainda sem wire completo da vitrine (wire = Phase 6).

**Independent Test**: gravar hero no admin; ler linha em SQL/select admin.

### TDD actions

- [ ] T028 **[US3]** Criar `tests/integration/conteudo-site-actions.test.ts`: não-admin chama `guardarConteudoSite` → `ok: false`; admin upsert ok — **red**
- [ ] T029 **[US3]** Criar `lib/actions/conteudo-site.ts`: `guardarConteudoSite` com invariantes, zod por chave, `createAdminClient` após `is_admin`, `revalidatePath('/')` — T028 verde
- [ ] T030 [P] **[US3]** Helper `lib/conteudo/carregar-conteudo.ts` (server-only) com fallback tipado por chave
- [ ] T031 **[US3]** Implementar `components/admin/ConteudoSiteForm.tsx` (tabs ou secções por chave) + `useActionState` + toast sucesso
- [ ] T032 **[US3]** Completar `app/admin/conteudo/page.tsx` carregando as 5 chaves e renderizando o form

**Checkpoint**: admin grava CMS; DB reflete; vitrine ainda pode estar hardcoded.

---

## Phase 6: User Story 3 (cont.) — Wire vitrine (Priority: P3)

**Goal**: componentes RSC leem `conteudo_site`; visual igual; WhatsApp fallback.

- [ ] T033 **[US3]** Alterar `Hero.tsx` para receber/ler conteúdo `hero` (RSC)
- [ ] T034 [P] **[US3]** Alterar `Maquee.tsx` para `marquee.mensagem`
- [ ] T035 [P] **[US3]** Alterar `QuemSomos.tsx` para dados `quem_somos`
- [ ] T036 **[US3]** Alterar `OndeNosEncontrar.tsx`: props do pai RSC (`titulo`, `endereco`, `lat`, `lng`, `mapa_embed_url`); manter client só para loading do iframe
- [ ] T037 **[US3]** Alterar `Rodape.tsx`: `instagram_url`, `texto_contato`, WhatsApp = `whatsapp_url` trim || `NUMEROZAP`; produtos continuam `gerarLinkWhatsapp`
- [ ] T038 **[US3]** Garantir página `app/page.tsx` (ou wrappers) carrega conteúdos uma vez e passa props — evitar N+1 desnecessário
- [ ] T039 **[US3]** Teste E2E esboço `tests/e2e/conteudo-site.spec.ts`: login → editar título hero → `/` anónimo mostra título — pode ficar completo na Phase 8

**Checkpoint**: copy da landing 100% data-driven; visual preservado.

---

## Phase 7: User Story 4 — SEO (Priority: P4)

**Goal**: metadataBase, OG/Twitter, PDP metadata, sitemap, robots.

- [ ] T040 [P] **[US4]** Documentar `NEXT_PUBLIC_SITE_URL=` em `exemple.env`
- [ ] T041 **[US4]** Atualizar `app/layout.tsx`: `metadataBase`, openGraph, twitter
- [ ] T042 **[US4]** `generateMetadata` em `app/produtos/[id]/page.tsx` (nome, descrição, imagem)
- [ ] T043 [P] **[US4]** Criar `app/sitemap.ts` — home + produtos `disponivel`
- [ ] T044 [P] **[US4]** Criar `app/robots.ts` referenciando sitemap
- [ ] T045 [P] **[US4]** Criar `tests/e2e/seo.spec.ts` smoke: `/sitemap.xml` e `/robots.txt` 200; meta og na home ou PDP

**Checkpoint**: SC-007/008 verificáveis.

---

## Phase 8: Polish + E2E + regressão

**Goal**: pirâmide completa; SC-009/010; nada da 001 partido.

- [ ] T046 **[US2]** E2E estender `tests/e2e/painel-crud.spec.ts`: editar ordem/destaque + assert toast (ou mensagem sucesso visível)
- [ ] T047 **[US3]** Completar `tests/e2e/conteudo-site.spec.ts` (CMS → vitrine)
- [ ] T048 [P] Correr `npm test && npm run test:integration && npm run test:e2e` — suites 001 + 002 verdes (SC-009)
- [ ] T049 [P] **[MANUAL]** Smoke LCP home em rede lenta (DevTools) — confirmar orçamento < 2,5 s / não piora óbvia (SC-010); registar nota em research se medir
- [ ] T050 **[MANUAL]** Percurso quickstart §3 completo com a dona (ou staging)
- [ ] T051 Revisar que nenhum ficheiro `"use client"` importa `admin.ts`; suite fronteira-segredos 001 ainda passa
- [ ] T052 Remover código morto da parede de cartões se `ProdutosGrid`/`ProdutoCard` admin deixarem de ser usados (ou reexportar tabela)

**Checkpoint**: feature completa para merge.

---

## Dependências (resumo)

```text
Phase 1 Setup
    └─► Phase 2 Migrações + deny tests
            ├─► Phase 3 US1 ordem/destaque
            │       └─► Phase 4 US2 shell + table
            │               └─► Phase 5 CMS actions/UI
            │                       └─► Phase 6 Wire vitrine
            └─► Phase 7 SEO (após tipos/DB; paralelo a 5–6 após T012)
                    └─► Phase 8 Polish E2E
```

Parallelismo útil após T012: T015–T020 ∥ início de schemas já feitos; SEO (T040–T045)
∥ Phase 5–6; T033–T037 `[P]` entre si após helper T030.

---

## Contagem

| Fase | Tasks | IDs |
|------|------:|-----|
| 1 Setup | 5 | T001–T005 |
| 2 Foundations | 9 | T006–T014 |
| 3 US1 | 6 | T015–T020 |
| 4 US2 | 7 | T021–T027 |
| 5 CMS CRUD | 5 | T028–T032 |
| 6 Wire vitrine | 7 | T033–T039 |
| 7 SEO | 6 | T040–T045 |
| 8 Polish | 7 | T046–T052 |
| **Total** | **52** | T001–T052 |

Marcadores: **[P]** onde indicado; **[MANUAL]** T049, T050; TDD explícito T006–T009, T015–T017, T028–T029.
