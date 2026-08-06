# Pesquisa — Fase 0

**Feature**: Painel, Conteúdo do Site e SEO
**Data**: 2026-08-06

Decisões técnicas tomadas antes do desenho. Cada uma regista o que foi escolhido, porquê,
e o que foi rejeitado. Decisões de produto já fechadas com o utilizador **não são
reabertas** — apenas documentadas com alternativas consideradas.

---

## D1 — CMS em `jsonb` por chave vs colunas tipadas / tabelas por secção

**Contexto**: cinco blocos de conteúdo institucional com formas diferentes (hero ≠
rodapé). Precisam de leitura pública, escrita só admin, e seed a partir do copy atual.

**Decisão**: uma tabela `public.conteudo_site` com `chave text` (PK), `conteudo jsonb
NOT NULL`, `atualizado_em timestamptz`. Validação da forma JSON por chave no schema
`zod` da aplicação (e espelhada nos contratos).

**Rationale**: cinco chaves estáveis, formas heterogéneas, volume minúsculo (5 linhas).
`jsonb` evita migração de coluna por cada campo de copy novo dentro de uma chave já
conhecida, mantém uma única política RLS, e alinha com leitura RSC simples
(`select conteudo where chave = $1`). A tipagem forte vive na fronteira `zod`, não no
DDL — coerente com o Princípio III (um schema por entidade/chave).

**Alternativas rejeitadas**:

| Alternativa | Porquê não |
|-------------|------------|
| Colunas tipadas por campo (`titulo_hero`, `cta_texto`, …) | Explode o esquema; cada ajuste de copy-shape exige migração; mistura cinco conceitos numa linha larga |
| Uma tabela por secção (`hero`, `marquee`, …) | Cinco RLSs e cinco seeds para o mesmo padrão de acesso; over-engineering à escala de 5 documentos |
| CMS headless externo (Sanity, etc.) | Novo fornecedor, custo, e foge da stack fixa da constituição |
| Markdown / ficheiros no repo | Continua a exigir deploy para mudar copy — exactamente o problema a resolver |

---

## D2 — Listagem admin: TanStack Table + shadcn Data Table vs manter cartões

**Contexto**: `ProdutosGrid` é uma parede de cartões. A dona precisa de pesquisar,
filtrar e paginar dezenas de produtos, e de ver ordem/destaque de relance.

**Decisão**: substituir a parede de cartões por tabela no padrão TanStack Table +
shadcn Data Table. Filtro, pesquisa e paginação **só no cliente**. Sem React Query nem
Zustand.

**Rationale**: à escala atual (dezenas), buscar tudo numa RSC e filtrar no cliente é
simples, testável e alinhado ao Princípio II (sem peso de infraestrutura). TanStack
Table é o padrão documentado pelo ecossistema shadcn para Data Table; traz ordenação de
colunas e paginação sem inventar estado ad hoc frágil.

**Alternativas rejeitadas**:

| Alternativa | Porquê não |
|-------------|------------|
| Manter cartões e acrescentar busca | Cartões não escalam visualmente para comparar ordem/destaque; a dona pediu tabela |
| Tabela HTML manual sem TanStack | Possível, mas reimplementa paginação/filtro/acessibilidade que o padrão já resolve |
| React Query + paginação servidor | Desproporcionado para dezenas de linhas; viola a decisão fechada FR-008 |
| Zustand para filtros | Estado de UI local basta (`useState`); store global seria complexidade sem problema |

---

## D3 — Escrita CMS: `createAdminClient` após `is_admin` vs só cliente de sessão + RLS

**Contexto**: Constituição I exige mutações via Server Action com verificação
`is_admin()`; RLS é rede de segurança. Produtos na Fase 1 escrevem com o cliente de
sessão (policies exigem `is_admin()`).

**Decisão**: escritas de `conteudo_site` **apenas** em Server Actions que (1) verificam
`is_admin()`, (2) validam `zod` por chave, (3) usam `createAdminClient()` (chave de
serviço) para o upsert. Leitura pública na vitrine usa o cliente de servidor com chave
publicável (respeita RLS de SELECT).

**Rationale**: decisão de produto fechada. O bypass admin após allowlist explícita é o
mesmo padrão mental de “servidor confia só depois de autorizar”; RLS continua a negar
INSERT/UPDATE/DELETE a `anon`/`authenticated` não cobertos por `is_admin()`, o que
protege pedidos diretos à API. Testes de integração cobrem ambas as camadas.

**Alternativas rejeitadas**:

| Alternativa | Porquê não |
|-------------|------------|
| Escrita só com JWT da sessão + policy `is_admin()` | Viável e simétrica aos produtos; rejeitada apenas porque a decisão de produto fixou admin client para CMS |
| Escrita a partir do browser com anon key | Viola Princípio I; reabre o antípadrão da auditoria |

---

## D4 — Shell do painel: `app/admin/layout.tsx` + shadcn vs páginas soltas

**Contexto**: páginas admin existem sem invólucro partilhado de navegação; login deve
continuar fora do chrome com sidebar.

**Decisão**: `app/admin/layout.tsx` com sidebar (Produtos | Conteúdo do site | Sair).
Primitivos shadcn em `components/ui/` (Button, Input, Label, Table, Dialog, Sheet,
Textarea, Switch, Sonner). Rota de login permanece sem sidebar (layout condicional por
segmento ou grupo de rotas).

**Rationale**: uma fonte de navegação (Princípio IV para UI partilhada). shadcn alinha
com Tailwind 4 já no projeto e evita inventar Design System. Sonner satisfaz Princípio
V (`alert()` proibido).

**Alternativas rejeitadas**: nav só na página de produtos; UI kit completo (MUI, etc.)
fora da stack.

---

## D5 — WhatsApp: `NUMEROZAP` como fallback vs migrar tudo para CMS

**Contexto**: rodapé usa `NUMEROZAP`; produtos usam `gerarLinkWhatsapp`.

**Decisão**: manter `NUMEROZAP` e `gerarLinkWhatsapp` em `lib/constants.ts`. O rodapé
prefere `rodape.whatsapp_url` quando presente e não vazio. Links de produto **não**
leem o CMS.

**Rationale**: evita que um campo de rodapé mal preenchido parta todos os CTAs de
compra; produto e contacto institucional podem divergir de propósito. Fallback garante
que seed/migração incompleta não deixa o rodapé sem link.

**Alternativas rejeitadas**: uma única fonte CMS para todos os wa.me; remover
`NUMEROZAP` — ambos aumentam o risco de regressão na conversão WhatsApp.

---

## D6 — SEO: Metadata API do App Router vs CMS de SEO

**Contexto**: hoje só título/descrição mínimos no root layout; sem sitemap/robots/OG.

**Decisão**: `metadataBase` a partir de `NEXT_PUBLIC_SITE_URL` (documentado em
`exemple.env`); OG/Twitter no root layout; `generateMetadata` na PDP; `app/sitemap.ts`
e `app/robots.ts`.

**Rationale**: nativo do Next.js 16, zero dependências, URLs absolutas corretas para
partilha. SEO por produto deriva dos dados já públicos. Fora de âmbito um CMS de
campos SEO por página.

**Alternativas rejeitadas**: next-seo de terceiros; gerar sitemap em build script
externo; Meta Catalog (explicitamente fora de âmbito).

---

## D7 — Destaque no catálogo: selo mínimo vs secção “destaques” elaborada

**Contexto**: FR exige superfície de destaque sem redesenhar a landing.

**Decisão**: implementação mínima — badge/selo no cartão de vitrine e/ou faixa curta
de destacados no topo do catálogo. Sem grelha nova, sem motion.

**Rationale**: orçamento visual fechado (sem redesign). Qualquer das duas superfícies
mínimas satisfaz SC-002; a task de implementação escolhe a mais barata que passe o
E2E.

**Alternativas rejeitadas**: carrossel hero de destaques; reordenar categorias por
destaque — ambas são redesign.

---

## D8 — Migrações `0005` / `0006` vs uma migração monolítica

**Decisão**: `0005_ordem_destaque.sql` (colunas em `produtos`) e
`0006_conteudo_site.sql` (tabela + RLS + seed) separadas.

**Rationale**: permite aplicar e testar ordem/destaque (História 1) antes do CMS;
reversão e revisão de PR mais claras; espelha o estilo da Fase 1 (uma preocupação por
ficheiro).

**Alternativas rejeitadas**: uma única `0005` com tudo — atrasa o feedback da pirâmide
de testes na parte de produtos.

---

## D9 — Dependências a acrescentar

| Pacote | Motivo | Alternativa rejeitada |
|--------|--------|----------------------|
| `shadcn` primitives (cli + componentes copiados) | UI do painel e Data Table | CSS manual duplicado |
| `@tanstack/react-table` | motor da Data Table | tabela caseira |
| `sonner` | toasts (Princípio V) | `alert()`, toast caseiro |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` | peers habituais do shadcn | — |

**Não acrescentar**: `@tanstack/react-query`, `zustand`, `framer-motion`, GSAP,
Three.js.

---

## D10 — Pirâmide de testes desta feature

| Camada | O quê |
|--------|-------|
| Unitário (~30 %) | Schemas `zod` de produto estendido (`ordem`, `destaque`) e de cada chave CMS |
| Integração (~50 %) | Actions CMS e produto negam não-admin; RLS `conteudo_site` SELECT público / mutação só admin; ordenação pública |
| E2E (~20 %) | CRUD admin com ordem/destaque + toast; editar CMS e ver alteração em `/`; smoke SEO (`/sitemap.xml`, metadados PDP) |

**Invariante**: preservar testes da `001` (acesso negado, fronteira de segredos,
autorização painel, vitrine).

---

## D11 — Onde NÃO mexer (âmbitos fechados)

Confirmado fora de âmbito e sem tarefas: GSAP, Three.js, Framer Motion, redesign da
landing, Meta Catalog, UI de password, CMS de arte de categoria, CSP enforce.

---

## Resolução de NEEDS CLARIFICATION

Nenhum marcador restante na spec. Decisões de produto foram fechadas antes desta
pesquisa; este documento só regista trade-offs para implementadores.
