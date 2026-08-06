# Feature Specification: Painel, Conteúdo do Site e SEO

**Feature Branch**: `002-painel-conteudo-seo`

**Created**: 2026-08-06

**Status**: Draft

**Input**: Fase 2 do plano de melhoria do Silvania's Cacau — tornar o painel usável no
dia a dia (lista de produtos e conteúdo da vitrine editáveis) e completar metadados SEO
básicos, sem redesenho visual da landing nem trabalho de animação.

## Contexto

A Fase 1 (`001-seguranca-acesso-admin`) fechou a cadeia de ataque e migrou as escritas
do catálogo para o servidor. O painel continua funcionalmente mínimo: a listagem de
produtos é uma parede de cartões sem ordenação nem destaque, e todo o texto institucional
da página inicial (hero, faixa, quem somos, localização, rodapé) está hardcoded nos
componentes. Qualquer ajuste de copy ou de ordem de produto exige alteração de código e
novo lançamento.

Esta especificação cobre três entregas encadeadas: (1) a dona controla ordem e destaque
dos produtos no catálogo público; (2) o painel ganha um invólucro estável e uma tabela
de produtos gerível, mais um ecrã para editar o conteúdo da vitrine; (3) a vitrine passa
a ler esse conteúdo e o site publica metadados, mapa do site e robots. Fora de âmbito:
redesenho visual, GSAP/Three.js/Framer Motion, catálogo Meta, alteração de palavra-passe
na UI, CMS de arte de categorias, e endurecimento de CSP para modo de bloqueio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ordenar e destacar produtos no catálogo (Priority: P1)

A dona precisa de decidir quais produtos aparecem primeiro e quais merecem destaque na
vitrine — por exemplo, um lançamento sazonal ou o best-seller da semana. Hoje a ordem
pública segue só a data de criação. Passa a existir uma ordem explícita e um marcador de
destaque; o visitante vê o catálogo nessa ordem, com o destaque visível de forma mínima
(selo ou secção inicial), sem mudar o aspeto geral da página.

**Why this priority**: é valor de negócio imediato e independente do CMS. Sozinha, já
permite gerir a vitrine comercial sem tocar em código.

**Independent Test**: marcar dois produtos com ordens distintas e um com destaque;
confirmar na página inicial que a ordem pública respeita ordem crescente e que o
destaque aparece. Confirmar que quem não é administrador não consegue alterar estes
campos.

**Acceptance Scenarios**:

1. **Given** dois produtos disponíveis com `ordem` 1 e 10, **When** um visitante abre a
   página inicial, **Then** o de ordem 1 aparece antes do de ordem 10 no catálogo.
2. **Given** dois produtos com a mesma `ordem`, **When** o catálogo é listado, **Then**
   o mais recente (`created_at` descendente) aparece primeiro entre eles.
3. **Given** um produto marcado como destaque, **When** o visitante vê o catálogo,
   **Then** esse produto é identificável como destaque (selo ou secção dedicada
   mínima).
4. **Given** a administradora no painel, **When** altera ordem e destaque e grava,
   **Then** a alteração fica persistida e um toque de confirmação é mostrado.
5. **Given** uma conta autenticada fora da lista de administradores, **When** tenta
   alterar ordem ou destaque por qualquer via, **Then** a operação é recusada e os
   dados permanecem inalterados.

---

### User Story 2 - Painel com navegação estável e lista de produtos gerível (Priority: P2)

A dona precisa de um painel previsível: barra lateral com Produtos, Conteúdo do site e
Sair; listagem de produtos em tabela com pesquisa, filtro e paginação no cliente
(escala de dezenas de produtos). A parede de cartões deixa de ser a forma principal de
gerir o catálogo. Formulários de produto passam a incluir ordem e destaque, e gravações
bem-sucedidas mostram confirmação sem `alert()`.

**Why this priority**: desbloqueia o uso diário do painel e prepara o ecrã de conteúdo.
Depende dos campos de ordem/destaque da História 1 para a tabela os expor.

**Independent Test**: entrar como administradora, navegar entre Produtos e Conteúdo do
site pela barra lateral, pesquisar um produto na tabela, editar ordem/destaque e ver o
toast de sucesso. Confirmar que anónimo e não-admin continuam reencaminhados.

**Acceptance Scenarios**:

1. **Given** a administradora autenticada, **When** abre qualquer página do painel,
   **Then** vê a barra lateral com Produtos, Conteúdo do site e Sair.
2. **Given** dezenas de produtos no catálogo, **When** abre a listagem, **Then** vê
   uma tabela (não uma parede de cartões) com pesquisa/filtro e paginação utilizáveis
   no cliente.
3. **Given** a administradora a editar um produto, **When** grava com sucesso,
   **Then** recebe confirmação visual (toast) e o formulário não usa `alert()`.
4. **Given** um visitante anónimo ou autenticado não administrador, **When** tenta
   abrir rotas do painel, **Then** é reencaminhado como na Fase 1 (sem regressão).

---

### User Story 3 - Editar o conteúdo da vitrine sem mexer em código (Priority: P3)

Textos e links institucionais da página inicial (hero, faixa, quem somos, onde
encontrar, rodapé) passam a ser editáveis no painel. A vitrine pública lê esses
valores e mantém o aspeto visual atual. O WhatsApp do rodapé pode ser sobrescrito pelo
conteúdo guardado; o link de WhatsApp dos produtos continua a usar o gerador existente
com o número de recurso. Escritas ao conteúdo só por administrador, via servidor;
leitura pública permitida.

**Why this priority**: elimina a dependência de lançamento para copy institucional.
Vem depois do invólucro do painel porque vive nesse ecrã.

**Independent Test**: alterar o título do hero no painel, gravar, abrir `/` sem sessão
e ver o novo título. Tentar a mesma escrita com conta não administradora e confirmar
recusa. Confirmar seed inicial igual ao copy atual hardcoded.

**Acceptance Scenarios**:

1. **Given** a administradora no ecrã Conteúdo do site, **When** altera o título do
   hero e grava, **Then** a página inicial anónima mostra o novo título sem novo
   lançamento de código.
2. **Given** as cinco chaves de conteúdo (hero, marquee, quem_somos, onde_encontrar,
   rodape), **When** a migração é aplicada, **Then** cada chave existe com o copy
   atual da vitrine como semente.
3. **Given** `rodape.whatsapp_url` preenchido, **When** o visitante abre o rodapé,
   **Then** o link de WhatsApp do rodapé usa esse valor; **And** o botão de WhatsApp
   de um produto continua a usar o gerador com o número de recurso.
4. **Given** `rodape.whatsapp_url` vazio ou ausente, **When** o visitante abre o
   rodapé, **Then** o link cai no número de recurso já existente.
5. **Given** uma conta fora da lista de administradores, **When** tenta inserir,
   alterar ou apagar conteúdo do site, **Then** a operação é recusada (aplicação e
   políticas de acesso).
6. **Given** um visitante anónimo, **When** a vitrine carrega, **Then** as secções
   leem o conteúdo guardado e o aspeto visual permanece o mesmo (sem animações novas).

---

### User Story 4 - O site comunica bem a motores de busca e partilhas (Priority: P4)

O site passa a expor metadados de partilha (Open Graph / Twitter) na raiz, metadados
por página de produto, um mapa do site e um ficheiro robots. A base de URLs absolutas
vem de uma variável de ambiente de URL do site, documentada no exemplo de ambiente.

**Why this priority**: não bloqueia o painel nem a edição de conteúdo, mas completa a
presença pública. Pode ser validada independentemente.

**Independent Test**: abrir o código-fonte de `/` e de uma página de produto e
confirmar metadados OG; pedir `/sitemap.xml` e `/robots.txt` e verificar URLs baseadas
na variável de ambiente.

**Acceptance Scenarios**:

1. **Given** `NEXT_PUBLIC_SITE_URL` definido, **When** um visitante (ou rastreador)
   abre a página inicial, **Then** a resposta inclui metadados de partilha com URLs
   absolutas derivadas dessa base.
2. **Given** um produto disponível, **When** a sua página é pedida, **Then** os
   metadados refletem nome e descrição (ou recurso) desse produto.
3. **Given** o site em execução, **When** se pede `/sitemap.xml`, **Then** a resposta
   lista a página inicial e as páginas de produtos disponíveis com URLs absolutas.
4. **Given** o site em execução, **When** se pede `/robots.txt`, **Then** a resposta
   referencia o mapa do site e não bloqueia a vitrine pública.

---

### Edge Cases

- Produto com `ordem` negativa ou não numérica no formulário: validação na fronteira
  recusa antes de gravar.
- Dois produtos com a mesma ordem: desempate estável por `created_at` descendente.
- Chave de conteúdo desconhecida ou JSON com campos em falta: validação por chave
  recusa a gravação; a vitrine, se encontrar conteúdo inválido em leitura, cai no
  recurso (copy/seed ou constantes) sem partir a página.
- `whatsapp_url` mal formado: recusado na validação; o rodapé não grava o valor inválido.
- Sessão de administrador expira a meio da edição de conteúdo: a submissão seguinte
  informa e não finge sucesso.
- Remoção de administrador com o ecrã de conteúdo aberto: a gravação seguinte é
  recusada.
- Variável `NEXT_PUBLIC_SITE_URL` em falta em desenvolvimento: build/aviso documentado;
  metadados absolutos não inventam domínio de produção.
- Regressão da Fase 1: suites de acesso negado e E2E de autorização/vitrine continuam a
  passar.

## Requirements *(mandatory)*

### Functional Requirements

**Produtos — ordem e destaque**

- **FR-001**: O sistema MUST persistir em cada produto um inteiro `ordem` (não nulo,
  omissão 0) e um booleano `destaque` (não nulo, omissão falso).
- **FR-002**: O catálogo público MUST listar produtos disponíveis ordenados por `ordem`
  ascendente e, em empate, por `created_at` descendente.
- **FR-003**: O sistema MUST tornar o destaque visível no catálogo público de forma
  mínima (selo no cartão ou secção inicial de destacados), sem redesenhar a landing.
- **FR-004**: O formulário de produto no painel MUST permitir editar `ordem` e
  `destaque`.
- **FR-005**: Alterações a `ordem` e `destaque` MUST passar pelas mesmas regras de
  autorização da Fase 1 (só administrador; escrita via servidor; políticas por comando).

**Painel — invólucro e listagem**

- **FR-006**: O painel MUST apresentar barra lateral com as entradas Produtos,
  Conteúdo do site e Sair, partilhada pelo layout administrativo.
- **FR-007**: A listagem de produtos do painel MUST usar tabela com pesquisa, filtro e
  paginação no cliente, adequada à escala atual (dezenas de produtos).
- **FR-008**: O sistema MUST NOT introduzir biblioteca de estado global de cliente nem
  biblioteca de cache de pedidos remota para esta listagem.
- **FR-009**: Gravações bem-sucedidas de produto e de conteúdo do site MUST mostrar
  confirmação visual (toast); `alert()` MUST NOT ser usado.
- **FR-010**: Formulários de produto e de conteúdo MUST usar estado de ação de
  formulário do lado do cliente compatível com ações de servidor, com prevenção de
  duplo-envio.

**Conteúdo do site (CMS)**

- **FR-011**: O sistema MUST manter uma tabela de conteúdo do site indexada por chave
  textual, com corpo em JSON e carimbo de atualização.
- **FR-012**: As chaves suportadas MUST ser exatamente: `hero`, `marquee`,
  `quem_somos`, `onde_encontrar`, `rodape`.
- **FR-013**: Cada chave MUST ter forma JSON documentada e validada na fronteira
  (ver entidades e modelo de dados).
- **FR-014**: A migração MUST semear as cinco chaves com o copy e caminhos de imagem
  atualmente hardcoded nos componentes da vitrine.
- **FR-015**: Leitura do conteúdo MUST ser permitida a anónimo e autenticado; inserção,
  atualização e remoção MUST ser permitidas apenas a administradores.
- **FR-016**: Escritas de conteúdo MUST ocorrer apenas via ações de servidor que
  verificam administrador e usam o cliente privilegiado de servidor após essa
  verificação — nunca a partir do navegador com a chave publicável.
- **FR-017**: Os componentes da vitrine (hero, faixa, quem somos, onde encontrar,
  rodapé) MUST passar a ler o conteúdo guardado no servidor, preservando o aspeto
  visual atual.
- **FR-018**: `NUMEROZAP` em constantes MUST permanecer como recurso; o rodapé MUST
  preferir `rodape.whatsapp_url` quando presente e não vazio; links de WhatsApp de
  produto MUST continuar a usar o gerador existente.

**SEO**

- **FR-019**: O layout raiz MUST definir base de metadados a partir de
  `NEXT_PUBLIC_SITE_URL` e incluir metadados Open Graph e Twitter.
- **FR-020**: Cada página de produto MUST gerar metadados próprios (título, descrição,
  imagem quando existir).
- **FR-021**: O sistema MUST expor `/sitemap.xml` com a página inicial e produtos
  disponíveis.
- **FR-022**: O sistema MUST expor `/robots.txt` referenciando o mapa do site.
- **FR-023**: `exemple.env` MUST documentar `NEXT_PUBLIC_SITE_URL`.

**Segurança e regressão**

- **FR-024**: Toda a alteração de políticas de acesso nesta feature MUST ter teste que
  prove que o acesso não autorizado é **negado**.
- **FR-025**: As suites de acesso negado e os E2E de autorização e vitrine da Fase 1
  MUST continuar a passar.
- **FR-026**: Mensagens de erro ao utilizador MUST ser em PT-BR e MUST NOT expor
  detalhes internos da base de dados.

### Key Entities

- **Produto** (existente, estendido): ganha `ordem` e `destaque` para controlar a
  vitrine comercial.
- **Conteúdo do Site**: documento JSON identificado por chave (`hero`, `marquee`,
  `quem_somos`, `onde_encontrar`, `rodape`), com carimbo de atualização; leitura
  pública, escrita só por administrador.
- **Metadados de Página**: título, descrição e imagens de partilha derivados do
  conteúdo público e da URL base do site.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100 % dos casos de teste com ordens distintas, o catálogo público
  apresenta produtos disponíveis na ordem crescente de `ordem`, com desempate por
  `created_at` descendente.
- **SC-002**: 100 % dos produtos com `destaque = true` são identificáveis como
  destaque na vitrine no percurso E2E definido.
- **SC-003**: Conta autenticada fora de administradores obtém 0 escritas bem-sucedidas
  em `ordem`/`destaque` e em conteúdo do site — medido por testes de integração.
- **SC-004**: Após editar e gravar o hero no painel, um visitante anónimo vê o novo
  título em `/` em menos de 1 minuto, sem novo lançamento de código.
- **SC-005**: As cinco chaves de conteúdo existem após migração, com seed igual ao
  copy atual hardcoded (verificação por consulta ou teste de seed).
- **SC-006**: 100 % das gravações bem-sucedidas de produto e de conteúdo no painel
  mostram toast; 0 usos de `alert()` nos fluxos tocados.
- **SC-007**: `/sitemap.xml` e `/robots.txt` respondem 200 em ambiente de teste e
  listam/referenciam URLs absolutas baseadas em `NEXT_PUBLIC_SITE_URL`.
- **SC-008**: Página de produto disponível expõe metadados OG com título contendo o
  nome do produto.
- **SC-009**: Suites de regressão da Fase 1 (acesso negado, autorização do painel,
  vitrine pública) permanecem verdes após a feature.
- **SC-010**: LCP percebido da página inicial não piora de forma mensurável face à
  medição pós-Fase 1 (mesmo orçamento: LCP < 2,5 s em 4G).

## Assumptions

- A escala do catálogo permanece na ordem das dezenas de produtos; pesquisa e
  paginação só no cliente são suficientes.
- O aspeto visual da landing é intencionalmente preservado; mudar copy não implica
  mudar layout, tipografia ou motion.
- Imagens referenciadas no conteúdo (hero, quem somos) continuam a viver em `public/`
  ou URLs já usadas; upload de imagens institucionais via CMS **não** faz parte desta
  feature — só caminhos/URLs em texto.
- Existe exatamente o modelo de autorização da Fase 1 (`admins`, `is_admin()`); esta
  feature não o reabre.
- Uma única administradora (a dona) é o utilizador-alvo do painel no dia a dia.
- `NEXT_PUBLIC_SITE_URL` em produção será o domínio canónico do site na Vercel.

## Out of Scope

- GSAP, Three.js, Framer Motion, ou qualquer trabalho de animação/motion novo.
- Redesenho visual da landing ou do catálogo público.
- Meta Catalog / feed de produtos para anúncios.
- UI de alteração de palavra-passe.
- CMS para arte ou imagens de categoria.
- Passar CSP de observação para bloqueio.
- React Query, Zustand, ou equivalente.
- Upload de imagens institucionais pelo painel (apenas edição de caminhos/URLs).

## Dependencies

- Feature `001-seguranca-acesso-admin` concluída (Server Actions de produto, RLS,
  `is_admin()`, testes de acesso negado, proxy restrito a `/admin`).
- Componentes atuais da vitrine como fonte do seed de conteúdo.
