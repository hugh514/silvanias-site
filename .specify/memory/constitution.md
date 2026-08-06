<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (unversioned) → 1.0.0
Bump rationale: MAJOR — primeira ratificação. Template de placeholders substituído
por seis princípios concretos. Não há versão anterior de onde derivar um bump menor.

Princípios definidos (todos novos):
  [PRINCIPLE_1_NAME] → I. Segurança por Omissão (NÃO NEGOCIÁVEL)
  [PRINCIPLE_2_NAME] → II. O Cliente Vê Primeiro
  [PRINCIPLE_3_NAME] → III. Validação na Fronteira
  [PRINCIPLE_4_NAME] → IV. Uma Fonte de Verdade por Conceito
  [PRINCIPLE_5_NAME] → V. Feedback Honesto ao Utilizador
  (adicionado)       → VI. Mudança Verificada

Secções adicionadas:
  [SECTION_2_NAME] → Restrições Técnicas   (stack fixa, orçamento de performance, idioma)
  [SECTION_3_NAME] → Fluxo de Desenvolvimento (gates de PR, ordem das fases)

Secções removidas: nenhuma.

Templates dependentes:
  ✅ .specify/templates/plan-template.md   — secção "Constitution Check" preenchida com os
                                             seis gates; substitui o placeholder genérico
  ⚠ .specify/templates/spec-template.md    — pendente: sem alterações obrigatórias detetadas,
                                             reavaliar se a Fase 3 introduzir requisitos de
                                             performance por spec
  ✅ .specify/templates/tasks-template.md   — adicionada secção "Regras da Constituição"
                                             que torna obrigatórios os testes de acesso
                                             negado, sobrepondo-se ao "OPTIONAL" das
                                             secções de teste do template
  ✅ .specify/templates/checklist-template.md — genérico, não referencia princípios

Follow-up TODOs: nenhum. Sem placeholders diferidos.
-->

# Constituição do Silvania's Cacau

Vitrine e catálogo de chocolate artesanal. O site público é o produto; o painel
administrativo existe para o alimentar. Não há checkout — a venda fecha por WhatsApp.

Esta constituição nasce de uma auditoria de segurança feita a 2026-07-25 que
confirmou, em produção, uma cadeia de ataque explorável: registo público de contas
aberto, política RLS `FOR ALL TO authenticated`, e `lib/supabase/server.ts` a usar a
chave de serviço em todas as páginas. Qualquer estranho podia criar conta e apagar o
catálogo inteiro. Vários princípios abaixo são consequência direta dessa falha e não
são negociáveis por conveniência.

## Core Principles

### I. Segurança por Omissão (NÃO NEGOCIÁVEL)

Nenhuma mutação de dados parte do browser. Toda a escrita — insert, update, delete,
upload — MUST passar por uma Server Action que verifica autenticação e autorização
(`is_admin()`) antes de tocar na base de dados.

A chave de serviço (`SUPABASE_SECRET_KEY`) MUST viver isolada em
`lib/supabase/admin.ts`. Esse módulo só pode ser importado por Server Actions; nunca
por Server Components de páginas, nunca por qualquer ficheiro com `"use client"`.

RLS é rede de segurança, nunca a única defesa. Cada policy MUST ser declarada por
comando (`select`, `insert`, `update`, `delete`) e nunca como `FOR ALL TO
authenticated`. Autorização MUST ser allowlist explícita; "tem sessão, logo é admin"
é precisamente a falha que originou este documento.

*Rationale*: a chave anon está no bundle JavaScript por design — é pública. Qualquer
defesa que dependa dela é decorativa. A defesa real vive no servidor, e o RLS é a
segunda camada para quando o servidor errar.

### II. O Cliente Vê Primeiro

O site público é o produto principal. Minimalismo é requisito funcional, não gosto
estético: cada secção acrescentada MUST justificar o seu peso em conteúdo e em bytes.

Orçamento de performance obrigatório: LCP abaixo de 2,5 s em 4G móvel. O canvas 3D
MUST ser sempre lazy-loaded e nunca bloquear o first paint.

Toda a animação MUST respeitar `prefers-reduced-motion` e MUST ter fallback estático.

Acessibilidade WCAG 2.1 AA é gate de merge, não extra: hierarquia de headings
correta, foco de teclado visível, `alt` em todas as imagens, e nada que se mova de
forma automática sem o utilizador poder parar.

*Rationale*: o visitante típico chega por telemóvel, com rede fraca, a decidir se
compra chocolate. Um hero 3D que atrase o first paint custa a venda que era suposto
ganhar.

### III. Validação na Fronteira

Um único schema `zod` por entidade, partilhado entre cliente e servidor. O servidor
MUST revalidar sempre, mesmo quando o cliente já validou — a validação do cliente é
uma cortesia de UX, não um controlo de segurança.

Nenhum input chega à base de dados sem atravessar o schema.

Uploads MUST validar tipo MIME, tamanho e extensão do lado do servidor, além dos
limites configurados no bucket. Os dois níveis são obrigatórios: o bucket protege
contra chamadas diretas à API, o servidor protege contra tudo o resto.

### IV. Uma Fonte de Verdade por Conceito

Tipos de domínio MUST ser gerados do schema Supabase, nunca redefinidos à mão em cada
componente. Tokens de design MUST viver em `@theme` no `globals.css`, nunca hardcoded
em componentes. Componentes de UI partilhados MUST viver em `components/ui/`.
Constantes de negócio MUST viver em `lib/constants.ts`.

*Rationale*: à data desta ratificação o tipo `Produto` está redefinido em cinco
ficheiros e o mesmo botão primário está reescrito em três. Cada duplicação é um sítio
onde a próxima alteração vai ser esquecida.

### V. Feedback Honesto ao Utilizador

`alert()` é proibido. Todo o estado assíncrono MUST ter loading, erro e sucesso
visíveis — `sonner` para toasts, `useActionState` para estado de formulário.

Toda a rota MUST ter `error.tsx` e `loading.tsx`.

Mensagens de erro MUST ser em PT-BR e claras, sem expor detalhes internos da base de
dados ao utilizador final. Todos os formulários MUST prevenir duplo-submit.

### VI. Mudança Verificada

Pirâmide de testes como alvo de esforço: ~30 % unitário (schemas `zod`, funções puras
em `lib/`), ~50 % integração (Server Actions, policies RLS), ~20 % E2E Playwright nos
fluxos críticos — login de admin, CRUD de produto, vitrine carrega.

Nenhuma alteração a RLS ou a policies vai para produção sem um teste que prove que o
acesso não autorizado é **negado**. Testar que o admin consegue escrever não prova
nada; o que interessa é provar que o não-admin não consegue.

CI MUST correr lint, build e testes em cada PR.

## Restrições Técnicas

**Stack fixa**: Next.js 16 (App Router), React 19 com React Compiler, TypeScript em
modo `strict`, Tailwind CSS 4, Supabase (Postgres + Auth + Storage), deploy na Vercel.
Sair desta stack exige emenda a esta constituição.

**Fronteira de segredos**: `NEXT_PUBLIC_*` é público e assume-se comprometido.
`SUPABASE_SECRET_KEY` nunca aparece em código de cliente, em logs, ou em mensagens de
erro devolvidas ao browser.

**Orçamento de performance**: LCP < 2,5 s em 4G móvel. O bundle 3D não conta para o
carregamento inicial por ser lazy-loaded, mas MUST ter fallback estático para quem
nunca o receber.

**Idioma**: todo o conteúdo visível ao utilizador e todas as mensagens de erro em
PT-BR. Código, nomes de variáveis e mensagens de commit seguem o padrão já existente
no repositório.

## Fluxo de Desenvolvimento

O trabalho segue três fases, nesta ordem, e a ordem não é arbitrária: mexer em UI
enquanto a autorização está partida gera retrabalho e esconde regressões de segurança.

1. **Segurança** — fechar a cadeia de ataque confirmada na auditoria.
2. **Arquitetura** — Server Actions, tipos gerados, cache e revalidação, painel novo.
3. **UI/3D** — redesenho minimalista, hero 3D, animação de scroll.

**Gates de PR**: lint passa, build passa, testes passam, e nenhum ficheiro
`"use client"` importa `lib/supabase/admin.ts`. Um PR que mova escrita para o cliente
ou exponha a chave de serviço é rejeitado independentemente da qualidade do resto.

## Governance

Esta constituição prevalece sobre qualquer outra prática do projeto. Em caso de
conflito entre um princípio aqui e um padrão herdado do código existente, o princípio
ganha e o código existente é corrigido.

**Emendas** exigem justificação escrita no PR que as propõe, indicando qual princípio
muda e porquê. O Princípio I não é emendável por conveniência de implementação — só
por uma alteração real ao modelo de ameaça, documentada.

**Versionamento** semântico: MAJOR para remoção ou redefinição incompatível de
princípios; MINOR para princípio ou secção nova; PATCH para clarificações e correções
sem efeito semântico.

**Revisão de conformidade**: cada PR verifica os gates acima. Complexidade
acrescentada MUST ser justificada na secção "Complexity Tracking" do plano — a
resposta por omissão a "precisamos mesmo disto?" é não.

**Version**: 1.0.0 | **Ratified**: 2026-07-25 | **Last Amended**: 2026-07-25
