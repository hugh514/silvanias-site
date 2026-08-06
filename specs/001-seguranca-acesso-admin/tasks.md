# Tasks: Segurança de Acesso ao Painel Administrativo

**Feature**: `001-seguranca-acesso-admin`
**Input**: [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)
**Data**: 2026-07-25

**Testes são obrigatórios nesta feature**, não opcionais. O Princípio VI da constituição e
o critério SC-010 exigem que toda a alteração às regras de acesso tenha um teste que prove
que o acesso não autorizado é **negado**.

---

## Regras da Constituição (v1.0.0)

Aplicam-se a todas as fases abaixo e sobrepõem-se ao "OPTIONAL" do template base.

- **Teste de acesso negado é obrigatório** para qualquer task que crie ou altere política
  de acesso, `is_admin()`, ou middleware de autorização.
- **Task de fronteira de segredos** obrigatória em features que toquem Supabase.
- **Rotas novas vêm em trio**: rota + `error.tsx` + `loading.tsx`.
- **Tasks de animação vêm em par** — não aplicável nesta fase, sem animações.

---

## Convenções de caminho

Aplicação única em App Router na raiz do repositório. Sem prefixo `src/`.

**Identificadores**: os números de task são estáveis e não são reatribuídos. A ordem de
execução é a ordem do documento, não a ordem numérica — as tasks T064 a T068 foram
acrescentadas após a análise de consistência e estão colocadas fisicamente na fase a que
pertencem.

**Marcador `[P]`**: significa ficheiros distintos e sem dependência entre si. Tasks que
escrevem no mesmo ficheiro **não** o levam, mesmo quando são logicamente independentes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: pôr as ferramentas de pé. Nada aqui altera comportamento em produção.

- [x] T001 [P] Instalar dependências de execução em `package.json`: `server-only@0.0.1` e `zod@4.4.3`
- [x] T002 [P] Instalar dependências de desenvolvimento em `package.json`: `vitest@4.1.10`, `@playwright/test@1.62.0`, `supabase@2.109.1`
- [x] T003 [P] Criar `vitest.config.ts` com ambiente Node, separando as suites `tests/unit` e `tests/integration`
- [x] T004 [P] Criar `playwright.config.ts` apontando ao servidor de desenvolvimento local
- [x] T005 Acrescentar os scripts `test`, `test:integration`, `test:e2e` e `db:types` a `package.json`
- [x] T006 Criar `supabase/migrations/` e inicializar a estrutura da ferramenta de linha de comandos com `supabase init`
- [x] T007 **Salvaguarda crítica**: criar `tests/setup/guarda-ambiente.ts` que aborta a execução se `NEXT_PUBLIC_SUPABASE_URL` apontar para o projeto de produção (`khfebjavstjyzfhxwmvm`). Ligar como ficheiro de arranque em `vitest.config.ts`. **Nenhum teste corre antes desta task existir**
- [x] T008 Levantar o ambiente local de base de dados com `supabase start`. **O serviço de contentores não está acessível nesta máquina** (Docker 29.3.1 instalado, daemon em baixo; Podman 5.8.1 disponível). Tentar via `DOCKER_HOST` apontado ao socket do Podman. **Ponto de decisão explícito: ao fim de 1 hora sem sucesso, abandonar o ambiente local e criar um projeto Supabase gratuito dedicado a testes**, conforme D7 do research. Registar a escolha feita em `research.md`

**Checkpoint**: ferramentas prontas, salvaguarda de ambiente ativa, e ambiente de teste decidido.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: alinhamento humano que tem de acontecer antes de qualquer alteração irreversível.

**⚠️ CRÍTICO**: nenhuma task de história pode começar antes desta fase.

- [x] T009 **[MANUAL — a executar pela dona, não automatizável]** Confirmar que não existem fotos de produto em GIF ou SVG no catálogo atual. Os limites de tipo do contentor (T014) vão passar a recusar esses formatos. Se existirem, converter para JPEG, PNG ou WebP **antes** de aplicar T014. SVG é excluído deliberadamente: num contentor público é vetor de execução de script no domínio da marca
- [x] T010 Confirmar que existe **exatamente uma** conta em `auth.users` — a da dona. Confirmado pela auditoria de 2026-07-25, mas reconfirmar imediatamente antes de aplicar T012. A migração 0001 semeia `public.admins` a partir da conta única existente e **aborta com erro explícito** se encontrar número diferente de 1, em vez de gravar um endereço de correio pessoal no repositório

**Checkpoint**: fundação alinhada. As histórias podem começar.

---

## Phase 3: User Story 1 + User Story 5 — Fechar a brecha sem partir a vitrine (Priority: P1) 🎯 MVP

**Goal**: só quem consta da lista de administradores escreve no catálogo (US1), e o
visitante anónimo não nota absolutamente nenhuma diferença (US5).

**Independent Test**: reproduzir a cadeia de ataque da auditoria com uma conta descartável
— todos os seis passos têm de falhar. Em paralelo, percorrer o site como visitante anónimo
e confirmar que catálogo, páginas de produto e imagens carregam na mesma.

**⚠️ US1 e US5 estão na mesma fase deliberadamente.** Ambas são P1 e são inseparáveis: uma
alteração de autorização que feche o catálogo ao público troca uma falha grave por outra
pior. Verificar a não regressão do visitante **depois** de publicar a autorização seria
descobrir o estrago tarde demais.

**Esta fase é entregável sozinha e fecha a vulnerabilidade sem alterar uma única linha de
TypeScript.** É o incremento que importa concluir hoje.

### Ação manual urgente

- [ ] T011 **[MANUAL — a executar pela dona, não automatizável]** **[US1]** **PASSO MAIS URGENTE DE TODO O PLANO.** Consola Supabase → Authentication → Sign In / Providers → desligar **Allow new users to sign up**. Corta sozinho o primeiro degrau da cadeia de ataque, em cerca de 30 segundos, sem depender de nenhuma outra task. Verificar com: `curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | grep disable_signup` — esperado `true`, era `false`

### Migrações (ordem lógica entre si, não paralelizáveis)

- [x] T012 **[US1]** Criar `supabase/migrations/0001_admins_e_is_admin.sql`: tabela `public.admins` (`user_id uuid` chave primária referenciando `auth.users(id)` com `on delete cascade`, `criado_em timestamptz not null default now()`), segurança ao nível da linha **ligada com zero políticas**, e a função `public.is_admin()` com `language sql`, `stable`, `security definer`, `set search_path = ''`, usando `(select auth.uid())`. Revogar execução de `public`, conceder a `authenticated`. Inserir a conta obtida em T010. Base de rascunho validada em `scratchpad/fix-rls.sql` da sessão de auditoria
- [x] T013 **[US1]** Criar `supabase/migrations/0002_politicas_produtos.sql`: remover **todas** as políticas existentes de `public.produtos` via bloco anónimo, e criar as quatro por comando conforme [contracts/politicas-acesso.md](./contracts/politicas-acesso.md) — `produtos_select_publico` (`select`, `anon` e `authenticated`, `disponivel is true or public.is_admin()`), `produtos_insert_admin`, `produtos_update_admin` (com uso **e** verificação), `produtos_delete_admin`
- [x] T014 **[US1]** Criar `supabase/migrations/0003_limites_e_politicas_storage.sql`: definir `file_size_limit = 5242880` e `allowed_mime_types` restrito a `image/jpeg`, `image/png`, `image/webp`, `image/avif` no contentor `produtos`; criar as quatro políticas de `storage.objects` — leitura pública, escrita/substituição/remoção só com `public.is_admin()`. **Depende de T009 estar confirmado**
- [x] T015 **[US1]** Aplicar as migrações 0001 a 0003 ao ambiente de teste e validar as consultas de verificação de [quickstart.md](./quickstart.md) — quatro políticas uma por comando, `count(*) = 1` em `admins`, limites do contentor corretos

### Testes de acesso NEGADO — obrigatórios, irmãos de T012-T014

Derivados das células **NEGA** da matriz em [contracts/politicas-acesso.md](./contracts/politicas-acesso.md). São 19 casos mínimos; os 11 desta fase cobrem as políticas.

- [x] T016 [P] **[US1]** Criar `tests/integration/helpers/utilizador-descartavel.ts`: cria utilizador com a credencial de serviço e `email_confirm: true`, autentica-o com a chave publicável, e **garante a remoção em bloco `finally`**. É o padrão usado nas sondas da auditoria
- [x] T017 **[US1]** Criar `tests/integration/acesso-negado.test.ts` — **a suite central de regressão**. Reproduz os seis passos da cadeia de ataque de 2026-07-25 e exige que **todos** falhem. Antes desta feature: criação travada só por `23502`, alteração e remoção com `204`, envio com `200` e ficheiro real criado
- [x] T018 **[US1]** Em `tests/integration/acesso-negado.test.ts`, 3 casos: conta autenticada fora de `admins` recebe recusa em criar, alterar e remover produto (esperado `42501`)
- [x] T019 **[US1]** Em `tests/integration/acesso-negado.test.ts`, 3 casos: conta autenticada fora de `admins` recebe recusa em enviar, substituir e remover ficheiro no contentor (esperado `403`)
- [x] T020 **[US5]** Em `tests/integration/acesso-negado.test.ts`, 2 casos: leitura de produto com `disponivel` falso ou nulo é negada a anónimo e a autenticado não administrador. Cobre também o caso `disponivel is null`, que a política trata como invisível por omissão
- [x] T021 **[US1]** Em `tests/integration/acesso-negado.test.ts`, 3 casos positivos de controlo: a administradora **consegue** criar, alterar e remover. Sem estes, uma política que negue tudo passaria os testes de negação e partiria o painel
- [x] T064 **[US1]** **[Correção C1 — colmata FR-005, que não tinha task nenhuma]** Em `tests/integration/acesso-negado.test.ts`: promover a conta descartável a administradora, confirmar que escreve, **removê-la de `admins` com a sessão ainda aberta**, e provar que a escrita seguinte é negada sem nova autenticação. É a prova da latência de revogação que justifica ter rejeitado a reivindicação embutida no token (decisão D3). Sem este teste, essa decisão é uma afirmação sem suporte
- [x] T065 [P] **[US1]** **[Correção C3 — colmata a ausência de guarda automática sobre FR-007]** Criar `tests/integration/registo-fechado.test.ts` que afirma `disable_signup = true` em `/auth/v1/settings`. T011 fecha o registo manualmente; este teste impede que volte a abrir sem ninguém dar por isso. É o primeiro degrau da cadeia de ataque e merece guarda permanente

### Não regressão do visitante — mesma fase, nunca depois

- [x] T022 [P] **[US5]** Criar `tests/e2e/vitrine-publica.spec.ts`: sem sessão, a página inicial carrega o catálogo com as fotos; a página de um produto disponível carrega por completo; as imagens do contentor respondem
- [x] T023 [P] **[US5]** Em `tests/e2e/vitrine-publica.spec.ts`: a página de um produto indisponível devolve não encontrado a um visitante anónimo
- [ ] T024 **[US1]** **[US5]** Validação manual conforme [quickstart.md](./quickstart.md): entrar no painel como a dona e criar, editar e apagar um produto de teste **sem nenhuma alteração de código**. É a prova do pressuposto central do plano (decisão D1: as migrações são retrocompatíveis). **Se falhar, parar e repensar a sequência antes de continuar**
- [x] T025 **[US1]** Executar `tests/integration/acesso-negado.test.ts` contra o ambiente com as migrações aplicadas e confirmar que nenhum dos seis passos da cadeia de ataque se reproduz. O guião original da auditoria está em `scratchpad/probe_authed.py` da sessão de 2026-07-25 e serve de referência para as asserções

**Checkpoint**: 🎯 **vulnerabilidade fechada e vitrine intacta.** Este é o MVP e pode ser publicado sozinho.

---

## Phase 4: User Story 2 — Estranhos não chegam ao painel (Priority: P2)

**Goal**: ter sessão deixa de ser suficiente para abrir o painel.

**Independent Test**: com conta autenticada fora de `admins`, aceder a `/admin/produtos` e confirmar o reencaminhamento.

- [x] T026 **[US2]** Criar `lib/supabase/admin.ts` com `import 'server-only'` na **primeira linha** e a credencial de serviço. Substitui o uso indevido em `lib/supabase/server.ts:11`
- [x] T027 **[US2]** Alterar `lib/supabase/server.ts` para usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os cookies, em vez de `SUPABASE_SECRET_KEY`. É o coração da correção do Princípio I: hoje toda a página de servidor corre com desvio às políticas, incluindo a página pública de produto
- [x] T028 **[US2]** **Task de fronteira de segredos (obrigatória pela constituição)**: criar `tests/integration/fronteira-segredos.test.ts` que confirma que a construção falha quando um ficheiro `"use client"` importa `lib/supabase/admin.ts`. Satisfaz FR-028 e SC-008
- [x] T029 **[US2]** Alterar `lib/supabase/proxy.ts` para verificar `is_admin()` além da existência de sessão (hoje linhas 36-44 só verificam `!user`)
- [x] T030 **[US2]** Alterar o `matcher` em `proxy.ts` para `/admin/:path*`. Hoje corre em **todas** as rotas e faz uma chamada de rede ao serviço de autenticação em cada visita à vitrine, que não usa sessão. Fecha a autorização **e** melhora o tempo de carregamento público (SC-009, Princípio II)
- [x] T031 [P] **[US2]** **Teste de acesso negado, irmão de T029**: em `tests/e2e/autorizacao-painel.spec.ts`, 2 casos — anónimo reencaminhado de `/admin/produtos`; autenticado não administrador **também** reencaminhado. Confirmar que vai para a página de entrada e não para uma página de erro, para não confirmar a existência do painel (mesma lógica de FR-021)
- [x] T032 [P] **[US2]** Em `tests/e2e/autorizacao-painel.spec.ts`: confirmar que o middleware **não** corre em `/`, verificável nos registos de execução
- [x] T033 **[US2]** Verificar que a página `app/admin/produtos/page.tsx` continua a ver produtos indisponíveis depois de T027 — passa a depender da sessão da administradora e de `is_admin()` em vez do desvio da credencial de serviço
- [x] T066 **[US5]** **[Correção C2 — colmata SC-009, que não era verificável]** Medir o LCP da página inicial em `tests/e2e/desempenho-vitrine.spec.ts`, **antes** de T030 e depois, registando ambos os valores em `research.md`. SC-009 exige que o tempo de carregamento não piore; T030 deve até melhorá-lo, ao tirar do caminho de cada visita à vitrine uma chamada de rede ao serviço de autenticação. Sem medição, é uma afirmação por fé

**Checkpoint**: painel inacessível a quem não é administrador; site público mais rápido.

---

## Phase 5: User Story 3 — O armazenamento aceita só fotos de produto (Priority: P3)

**Goal**: envio validado no servidor por conteúdo real, com nome gerado pelo sistema.

**Independent Test**: enviar um PDF renomeado para `.jpg`, um SVG, e um JPEG de 8 MB. Os três recusados.

- [x] T034 [P] **[US3]** Gerar `types/database.ts` com `supabase gen types typescript` e acrescentar o script `db:types`
- [x] T035 **[US3]** Eliminar as cinco redefinições manuais do tipo de produto, passando a importar de `types/database.ts`: `components/admin/ProdutosGrid.tsx:8`, `components/admin/ProdutoCard.tsx:4`, `components/admin/ProdutoForm.tsx:10`, `components/vitrine/CategoriaCaroulsel.tsx:7`, `components/vitrine/ProdutoCardVitrine.tsx:5` (Princípio IV)
- [x] T036 [P] **[US3]** Criar `lib/schemas/produto.ts` com o esquema `zod` partilhado, conforme a tabela de validação em [data-model.md](./data-model.md)
- [x] T037 [P] **[US3]** Criar `lib/upload/validar-imagem.ts` com quatro funções puras: detetar tipo real por assinatura de conteúdo, validar tipo e tamanho, gerar nome a partir do tipo **detetado**, e derivar caminho de armazenamento pelo **prefixo completo** — não pelo fragmento `/produtos/` de `components/admin/ProdutoForm.tsx:130`
- [x] T038 [P] **[US3]** Criar `tests/unit/validar-imagem.test.ts`: assinaturas de JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WebP (`RIFF`/`WEBP`) e AVIF (`ftyp`+`avif`/`avis`); rejeição de PDF renomeado; rejeição de SVG; ficheiro acima de 5 MB; nome `../../evil.jpg` produz nome seguro
- [x] T039 [P] **[US3]** Criar `tests/unit/schema-produto.test.ts`: nome vazio recusado, nome com 121 caracteres recusado, categoria fora de `CATEGORIAS` recusada, mais de 4 fotos recusadas, campos opcionais vazios convertidos em nulo

**Checkpoint**: validação de envio testada isoladamente, antes de ser ligada às ações.

---

## Phase 6: User Story 1 (continuação) — Escrita sai do navegador (Priority: P1)

**Goal**: cumprir o Princípio I por inteiro — nenhuma mutação parte do browser.

**Nota de sequência**: esta fase endurece o que a Fase 3 já protegeu. A brecha está fechada
desde a Fase 3; aqui garante-se que não reabre por alteração futura de código.

- [x] T040 **[US1]** Criar `lib/actions/produtos.ts` com `criarProduto`, seguindo os invariantes de [contracts/server-actions.md](./contracts/server-actions.md): sessão → `is_admin()` → validação → escrita → revalidação. Remover ficheiros já enviados se a gravação falhar, para não deixar órfãos
- [x] T041 **[US1]** Acrescentar `atualizarProduto` a `lib/actions/produtos.ts`. Remover fotos retiradas **depois** de a linha gravar com sucesso
- [x] T042 **[US1]** Acrescentar `removerProduto` a `lib/actions/produtos.ts`. Ordem deliberada: ficheiros primeiro, linha depois — a ordem inversa deixaria órfãos invisíveis
- [x] T043 **[US1]** Alterar `components/admin/ProdutoForm.tsx` para usar as ações via `useActionState`, removendo o `import` de `lib/supabase/client` e toda a lógica de envio, criação, alteração e remoção (hoje linhas 64-151). **Manter a aparência exatamente como está** — o redesenho é a Fase 2 do projeto
- [x] T044 [P] **[US1]** Substituir o `alert()` em `components/admin/UploadFotos.tsx:34` por estado de erro no componente (Princípio V)
- [x] T045 [P] **[US1]** Criar `app/admin/error.tsx` e `app/admin/loading.tsx` (regra do trio, Princípio V)
- [x] T046 [P] **[US5]** Criar `app/produtos/[id]/error.tsx` e `app/produtos/[id]/loading.tsx`
- [x] T067 [P] **[US5]** **[Correção D1 — Princípio V diz "toda a rota", a raiz ficava de fora]** Criar `app/error.tsx` e `app/loading.tsx` para a rota raiz. T045 cobre `/admin` e T046 cobre `/produtos/[id]`; sem esta task a página que mais tráfego recebe seria a única sem tratamento de erro
- [x] T047 **[US1]** Criar `tests/integration/acoes-produto.test.ts`: cada ação recusa sem sessão e recusa para conta fora de `admins`, **antes** de qualquer escrita. Prova que a verificação da aplicação é independente das políticas da base de dados
- [x] T048 **[US1]** Em `tests/integration/acoes-produto.test.ts`: falha de envio a meio não deixa ficheiros órfãos; remoção de produto inexistente devolve mensagem clara em vez de erro cru
- [x] T049 **[US1]** Em `tests/integration/acoes-produto.test.ts`: afirmar que nenhuma mensagem de erro devolvida pelas ações contém texto vindo da base de dados — sem códigos de erro Postgres, sem nomes de tabelas, colunas ou restrições (FR-029)

**Checkpoint**: Princípio I cumprido por inteiro.

---

## Phase 7: User Story 4 — Adivinhar a palavra-passe não compensa (Priority: P4)

**Goal**: 5 falhas por origem travam 15 minutos; mensagens não permitem enumerar contas.

- [x] T050 **[US4]** Criar `supabase/migrations/0004_tentativas_login.sql`: tabela `public.tentativas_login` com segurança ao nível da linha ligada e zero políticas, e as funções `registar_tentativa_falhada`, `entrada_bloqueada` e `limpar_tentativas`, todas `security definer` com `search_path` vazio. Incluir remoção oportunista de entradas com mais de 24 h dentro de `registar_tentativa_falhada`
- [x] T051 **[US4]** Criar `lib/actions/auth.ts` com `entrar`: consultar bloqueio → tentar autenticar → registar falha ou limpar contagem. Substitui a chamada direta em `components/admin/LoginForm.tsx:22-25`
- [x] T052 **[US4]** Acrescentar `sair` a `lib/actions/auth.ts`, satisfazendo FR-030. **Não existe hoje** — não há forma de terminar sessão no painel, o que é inaceitável em computador partilhado. Não exige `is_admin()`: quem detém a sessão pode encerrá-la
- [x] T053 **[US4]** Alterar `components/admin/LoginForm.tsx` para usar a ação `entrar` via `useActionState`
- [x] T054 **[US4]** Acrescentar um botão de saída ao painel usando a ação `sair`
- [x] T055 **[US4]** Criar `tests/integration/limite-tentativas.test.ts`: a 6.ª tentativa consecutiva falhada é travada; uma entrada correta antes da 5.ª repõe a contagem; após o período o acesso volta
- [x] T056 **[US4]** Em `tests/integration/limite-tentativas.test.ts`: a mensagem de erro é **idêntica** para endereço inexistente, palavra-passe errada, e conta válida ausente de `admins` (FR-021)

**Checkpoint**: força bruta travada e contas não enumeráveis.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T057 [P] Acrescentar cabeçalhos a `next.config.ts`: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. **Independente de todas as outras tasks**
- [x] T058 [P] Acrescentar `Content-Security-Policy-Report-Only` a `next.config.ts` com as origens levantadas em D6: `frame-src https://www.google.com`; `img-src 'self' data: https://khfebjavstjyzfhxwmvm.supabase.co`; `connect-src 'self' https://khfebjavstjyzfhxwmvm.supabase.co https://api.iconify.design`; `script-src 'self' https://va.vercel-scripts.com`. **Modo de observação, nunca bloqueio na primeira publicação**
- [x] T059 [P] Criar `.github/workflows/ci.yml` com análise estática, construção e testes em cada pedido de integração
- [x] T060 [P] Criar `tests/e2e/painel-crud.spec.ts`: percurso completo de entrada, criação, edição e remoção de produto
- [x] T061 Rever a contagem final contra os 19 casos mínimos de [contracts/politicas-acesso.md](./contracts/politicas-acesso.md) e registar qualquer célula **NEGA** que tenha ficado sem teste
- [x] T062 Atualizar `README.md` com o procedimento de gestão de administradores e de recuperação de acesso, conforme [quickstart.md](./quickstart.md)

---

## Phase 9: Consolidação (depende de tráfego real)

- [ ] T063 Após uma semana de observação, analisar as violações reportadas pela política de origens e passar `Content-Security-Policy-Report-Only` a `Content-Security-Policy` em `next.config.ts`. **Não executar sem os dados** — uma política mal calibrada parte o site em silêncio para o visitante

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)  ──────────────┐
                               ▼
Phase 2 (Foundational) ────────┤
                               ▼
Phase 3 (US1+US5) 🎯 MVP ──────┤  ← fecha a vulnerabilidade, entregável sozinha
                               ▼
Phase 4 (US2) ─────────────────┤
                               ▼
Phase 5 (US3) ─────────────────┤
                               ▼
Phase 6 (US1 cont.) ───────────┤
                               ▼
Phase 7 (US4) ─────────────────┤
                               ▼
Phase 8 (Polish) ──────────────┤
                               ▼
Phase 9 (Consolidação)         ← exige tráfego real
```

### Dependências internas relevantes

- **T011 não depende de nada.** É o passo mais urgente e pode ser feito imediatamente, antes de qualquer outra task
- T012 → T013 → T014 → T015: as migrações têm ordem lógica entre si
- T014 depende de T009 (confirmação sobre GIF/SVG)
- T012 depende de T010 (endereço da conta)
- T026, T027 → T028, T029 → T030
- T034 → T035
- T036, T037 → T040, T041, T042 → T043
- T050 → T051 → T053
- T057, T058, T059 são independentes de quase tudo
- T063 depende de T058 **e de uma semana de tráfego real**
- **Nenhum teste corre antes de T007** (salvaguarda de ambiente)

### Parallel Opportunities

| Grupo | Tasks | Nota |
|-------|-------|------|
| Setup | T001-T004 | ficheiros distintos |
| Não regressão | T022, T023 | independentes das migrações |
| Guarda de registo | T065 | ficheiro próprio |
| Unitários | T038, T039 | funções puras, sem dependências externas |
| Rotas de erro | T045, T046, T067 | pastas distintas |
| Polimento | T057, T058, T059, T060 | independentes entre si |

**Não paralelizáveis apesar de logicamente independentes** — escrevem no mesmo ficheiro:
T018, T019, T020, T021 e T064 partilham `tests/integration/acesso-negado.test.ts`;
T047, T048 e T049 partilham `tests/integration/acoes-produto.test.ts`;
T055 e T056 partilham `tests/integration/limite-tentativas.test.ts`.

---

## Implementation Strategy

### MVP — Fase 3 sozinha

A Fase 3 fecha a vulnerabilidade e não altera **uma única linha de TypeScript**. Depende
apenas de duas ações manuais (T009, T010, T011) e de três migrações SQL. É o incremento a
concluir hoje.

A ordem dentro do MVP importa: **T011 primeiro**, isolado, porque corta o primeiro degrau
da cadeia em cerca de 30 segundos e não depende de nada.

### Entrega incremental

| Entrega | Fases | Valor |
|---------|-------|-------|
| 1 | 1, 2, 3 | vulnerabilidade fechada, vitrine intacta |
| 2 | 4 | painel fechado a não administradores; site público mais rápido |
| 3 | 5, 6 | escrita fora do navegador; Princípio I cumprido |
| 4 | 7 | força bruta travada |
| 5 | 8 | cabeçalhos, integração contínua, percursos completos |
| 6 | 9 | política de origens em bloqueio |

Cada entrega é publicável de forma independente e nenhuma deixa o site em baixo.

---

## Notes

- **T011 é a task mais importante do documento.** Trinta segundos de trabalho manual que
  cortam sozinhos o primeiro degrau da cadeia de ataque, sem depender de código, migração,
  teste ou publicação.
- **Nunca recuperar acesso afrouxando uma política.** Se a lista de administradores ficar
  vazia, o procedimento está em [quickstart.md](./quickstart.md) e passa pela consola, que
  faz desvio às políticas. Repor `FOR ALL TO authenticated` seria repor a vulnerabilidade —
  por isso as migrações não têm reversão para o estado anterior.
- **T024 valida o pressuposto central do plano.** Se o painel deixar de escrever após as
  migrações, a decisão D1 está errada e a sequência tem de ser repensada antes de avançar.
- **T021 existe para evitar um falso positivo perigoso**: uma política que negue tudo
  passaria em todos os testes de negação e partiria o painel em silêncio.
- A substituição de `@iconify/react` por ícones locais foi identificada em D6 mas está
  **fora de âmbito** desta fase. Trocar 9 ficheiros de ícones no meio de uma alteração de
  segurança mistura riscos sem necessidade.
