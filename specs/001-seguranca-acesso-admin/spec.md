# Feature Specification: Segurança de Acesso ao Painel Administrativo

**Feature Branch**: `001-seguranca-acesso-admin`

**Created**: 2026-07-25

**Status**: Draft

**Input**: Fase 1 do plano de melhoria do Silvania's Cacau — fechar a cadeia de ataque
confirmada em produção pela auditoria de 2026-07-25 e endurecer a autorização do painel
administrativo.

## Contexto

Uma auditoria realizada a 2026-07-25 confirmou, com sondas executadas contra o ambiente
de produção, que qualquer pessoa na internet conseguia obter poder de administração
sobre o catálogo. A cadeia foi verificada de ponta a ponta:

1. O registo de contas estava aberto a qualquer visitante.
2. Uma conta acabada de criar bastava para o sistema a tratar como autorizada a escrever.
   Uma tentativa de criação de produto com essa conta foi travada apenas por um campo
   obrigatório em falta — a camada de autorização deixou passar.
3. Alterações e remoções de produtos foram aceites.
4. O envio de um ficheiro arbitrário para o armazenamento público foi aceite e criou um
   ficheiro real, que a auditoria removeu em seguida.
5. O armazenamento não tinha qualquer limite de tamanho nem restrição de tipo de
   ficheiro, funcionando na prática como alojamento aberto.

O impacto potencial era a perda ou adulteração total do catálogo — que é o produto do
negócio — e o uso do armazenamento da marca para servir conteúdo de terceiros.

Esta especificação cobre exclusivamente o fecho dessa cadeia. O redesenho visual e a
reconstrução do painel são fases seguintes e estão fora de âmbito.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Só quem está na lista pode mexer no catálogo (Priority: P1)

A dona do negócio precisa da certeza de que o catálogo só muda quando ela o muda.
Hoje, qualquer pessoa com uma conta no sistema é tratada como se fosse ela. O sistema
passa a manter uma lista explícita de quem tem poder de administração, e qualquer
tentativa de criar, alterar ou remover produtos feita por quem não está nessa lista é
recusada — venha ela do painel, do navegador, ou de uma chamada direta à interface de
dados.

**Why this priority**: é o elo que causa o dano irreversível. Enquanto isto não estiver
fechado, tudo o resto é secundário — a perda do catálogo é a perda do negócio online.
Sozinha, esta história já elimina o pior cenário.

**Independent Test**: com uma conta autenticada que não conste da lista de
administradores, tentar criar, alterar e remover um produto por via direta. Todas as
tentativas têm de ser recusadas. Em paralelo, a dona continua a conseguir fazer as três
operações pelo painel.

**Acceptance Scenarios**:

1. **Given** uma conta autenticada que não consta da lista de administradores, **When**
   tenta criar um produto, **Then** a operação é recusada e nenhum produto é criado.
2. **Given** essa mesma conta, **When** tenta alterar um produto existente, **Then** a
   operação é recusada e o produto permanece inalterado.
3. **Given** essa mesma conta, **When** tenta remover um produto, **Then** a operação é
   recusada e o produto permanece no catálogo.
4. **Given** a conta da dona, que consta da lista, **When** cria, altera e remove
   produtos pelo painel, **Then** todas as operações são concluídas com sucesso.
5. **Given** uma conta removida da lista de administradores, **When** faz o pedido
   seguinte, **Then** deixa de conseguir escrever, sem necessidade de intervenção manual.

---

### User Story 2 - Estranhos não conseguem sequer chegar ao painel (Priority: P2)

Deixa de ser possível a um visitante criar-se uma conta por iniciativa própria. As
contas passam a ser criadas apenas pela dona. E ter uma sessão aberta deixa de ser
suficiente para abrir o painel: quem não estiver na lista de administradores é
reencaminhado, mesmo estando autenticado.

**Why this priority**: remove o primeiro degrau da escada. A História 1 impede o dano;
esta impede a aproximação. É segunda porque, com a 1 já feita, um estranho que entre no
painel não consegue fazer nada — vê uma interface vazia de poder.

**Independent Test**: tentar criar uma conta a partir do exterior e verificar que é
recusado. Depois, com uma conta autenticada fora da lista, tentar abrir o painel e
verificar o reencaminhamento.

**Acceptance Scenarios**:

1. **Given** um visitante anónimo, **When** tenta criar uma conta por iniciativa
   própria, **Then** o pedido é recusado.
2. **Given** um utilizador autenticado que não consta da lista, **When** acede a
   qualquer página do painel, **Then** é reencaminhado para fora do painel.
3. **Given** a dona, **When** acede ao painel, **Then** entra normalmente.
4. **Given** a dona, **When** precisa de dar acesso a outra pessoa, **Then** consegue
   criar essa conta e adicioná-la à lista sem alterações ao código.

---

### User Story 3 - O armazenamento aceita só fotos de produto (Priority: P3)

O espaço de armazenamento deixa de aceitar qualquer ficheiro de qualquer tamanho. Passa
a aceitar apenas imagens, dentro de um limite de tamanho, e apenas de quem está na lista
de administradores. O nome com que o ficheiro é guardado deixa de depender do nome
escolhido por quem envia.

**Why this priority**: o risco aqui é de abuso e de reputação — servir conteúdo de
terceiros a partir do domínio da marca — mais do que de perda do catálogo. Grave, mas
menos imediato do que as duas primeiras.

**Independent Test**: tentar enviar um ficheiro que não é imagem, e um ficheiro acima do
limite de tamanho. Ambos recusados. Enviar uma imagem válida dentro do limite, aceite.

**Acceptance Scenarios**:

1. **Given** uma administradora autenticada, **When** envia um ficheiro que não é
   imagem, **Then** o envio é recusado com uma mensagem clara em português.
2. **Given** uma administradora autenticada, **When** envia uma imagem acima do limite
   de tamanho, **Then** o envio é recusado com uma mensagem clara em português.
3. **Given** um ficheiro cujo nome contém caracteres usados para navegar entre pastas,
   **When** é enviado, **Then** é guardado com um nome seguro e fica na pasta prevista.
4. **Given** um ficheiro renomeado para parecer imagem mas cujo conteúdo não é imagem,
   **When** é enviado, **Then** é recusado.
5. **Given** uma conta autenticada fora da lista, **When** tenta enviar ou remover um
   ficheiro, **Then** é recusada.

---

### User Story 4 - Adivinhar a palavra-passe deixa de compensar (Priority: P4)

Tentativas repetidas de entrada falhada a partir da mesma origem passam a ser travadas
durante um período. As respostas de erro não revelam se o endereço de correio existe no
sistema.

**Why this priority**: reduz a probabilidade de alguém chegar sequer a ter uma sessão
válida. Fica em último porque as histórias anteriores já limitam o que uma sessão vale.

**Independent Test**: falhar a entrada várias vezes seguidas a partir da mesma origem e
verificar que as tentativas seguintes são travadas; confirmar que a mensagem de erro é a
mesma para um endereço existente e um inexistente.

**Acceptance Scenarios**:

1. **Given** várias tentativas de entrada falhadas consecutivas da mesma origem,
   **When** é feita nova tentativa, **Then** é travada temporariamente.
2. **Given** um endereço que não existe no sistema, **When** é tentada a entrada,
   **Then** a mensagem de erro é indistinguível da de uma palavra-passe errada.
3. **Given** a dona, que errou a palavra-passe duas vezes, **When** acerta à terceira,
   **Then** entra normalmente sem ficar travada.

---

### User Story 5 - O visitante não nota diferença nenhuma (Priority: P1)

Toda a mudança de segurança é invisível para quem visita o site. O catálogo continua a
carregar, as fotos continuam a aparecer, o botão de WhatsApp continua a funcionar — sem
ser preciso criar conta ou entrar em lado nenhum. Produtos marcados como indisponíveis
continuam escondidos do público.

**Why this priority**: partilha a prioridade máxima com a História 1 porque é a rede de
proteção contra o próprio trabalho. Uma alteração de autorização que fecha o catálogo ao
público troca uma falha por outra pior — deixa de haver negócio.

**Independent Test**: percorrer o site como visitante anónimo, sem sessão, e confirmar
que o catálogo, as páginas de produto e as imagens carregam. Confirmar que um produto
marcado indisponível não aparece.

**Acceptance Scenarios**:

1. **Given** um visitante anónimo sem sessão, **When** abre a página inicial, **Then**
   vê o catálogo com os produtos disponíveis e as respetivas fotos.
2. **Given** um visitante anónimo, **When** abre a página de um produto disponível,
   **Then** a página carrega com todos os dados e imagens.
3. **Given** um produto marcado como indisponível, **When** um visitante anónimo tenta
   vê-lo, **Then** não o encontra no catálogo nem consegue obter os seus dados.
4. **Given** uma administradora, **When** consulta o painel, **Then** vê tanto os
   produtos disponíveis como os indisponíveis.

---

### Edge Cases

- Uma administradora é removida da lista enquanto tem o painel aberto e um formulário
  meio preenchido. A submissão seguinte é recusada com mensagem clara, sem erro cru.
- A sessão expira durante o preenchimento de um formulário longo. O sistema informa e
  não perde silenciosamente o trabalho nem finge que gravou.
- Um pedido de escrita chega diretamente à interface de dados, sem passar pelo painel.
  É recusado pela mesma regra que recusa os pedidos do painel.
- Um produto é removido por uma administradora enquanto outra o está a editar. A segunda
  recebe indicação de que o produto já não existe.
- O envio de fotos falha a meio, depois de algumas já terem sido guardadas. Não ficam
  ficheiros órfãos a ocupar espaço sem produto associado.
- A lista de administradores fica vazia por engano. Tem de haver forma documentada de
  recuperar o acesso sem editar código.
- Um ficheiro é enviado com um nome muito longo, com acentos, ou com caracteres de
  navegação entre pastas. É guardado em segurança na pasta prevista.

## Requirements *(mandatory)*

### Functional Requirements

**Autorização**

- **FR-001**: O sistema MUST manter uma lista explícita de contas com poder de
  administração. Pertencer à lista é a única forma de obter esse poder.
- **FR-002**: O sistema MUST recusar qualquer criação, alteração ou remoção de produtos
  originada por uma conta que não conste dessa lista, independentemente de a conta estar
  autenticada.
- **FR-003**: O sistema MUST aplicar a verificação de autorização do lado do servidor,
  antes de qualquer alteração de dados, e não confiar em verificações feitas no
  navegador.
- **FR-004**: O sistema MUST recusar pedidos de escrita que cheguem diretamente à
  interface de dados, sem passar pelo painel, pela mesma regra.
- **FR-005**: A remoção de uma conta da lista MUST ter efeito no pedido seguinte dessa
  conta, sem exigir intervenção manual.
- **FR-006**: O sistema MUST permitir à dona adicionar e remover administradores sem
  alterações ao código nem novo lançamento da aplicação.

**Acesso ao painel**

- **FR-007**: O sistema MUST recusar a criação de contas por iniciativa de visitantes.
  Contas passam a ser criadas apenas por quem já administra.
- **FR-008**: O sistema MUST reencaminhar para fora do painel qualquer utilizador
  autenticado que não conste da lista de administradores.
- **FR-009**: O sistema MUST manter o painel inacessível a visitantes sem sessão.

**Leitura pública**

- **FR-010**: O sistema MUST permitir a visitantes anónimos ler os produtos marcados
  como disponíveis e ver as respetivas imagens, sem exigir conta nem sessão.
- **FR-011**: O sistema MUST impedir que visitantes anónimos obtenham dados de produtos
  marcados como indisponíveis.
- **FR-012**: O sistema MUST permitir a administradores ver tanto produtos disponíveis
  como indisponíveis.

**Envio de ficheiros**

- **FR-013**: O sistema MUST aceitar apenas imagens nos formatos de uso corrente na web
  para fotos de produto, recusando qualquer outro tipo de ficheiro.
- **FR-014**: O sistema MUST recusar ficheiros acima de 5 MB.
- **FR-015**: O sistema MUST verificar o tipo real do ficheiro pelo seu conteúdo, e não
  apenas pela extensão ou pelo tipo declarado por quem envia.
- **FR-016**: O sistema MUST aplicar as restrições de tipo e tamanho tanto na aplicação
  como no próprio serviço de armazenamento, de forma que um pedido direto ao
  armazenamento fique igualmente restrito.
- **FR-017**: O sistema MUST guardar cada ficheiro com um nome gerado por si, de forma
  que o nome escolhido por quem envia não determine o local nem o nome final.
- **FR-018**: O sistema MUST recusar envios e remoções de ficheiros feitos por contas
  fora da lista de administradores.
- **FR-019**: O sistema MUST conseguir localizar e remover os ficheiros de um produto
  quando esse produto é removido, sem depender de interpretar o endereço público da
  imagem.

**Entrada no sistema**

- **FR-020**: O sistema MUST travar tentativas de entrada da mesma origem após 5
  falhas consecutivas, durante 15 minutos. Uma entrada bem-sucedida MUST repor a
  contagem a zero.
- **FR-021**: As mensagens de erro de entrada MUST ser idênticas para endereço
  inexistente e para palavra-passe errada, não revelando quais os endereços registados.
- **FR-030**: Um administrador MUST conseguir terminar a sua sessão a partir do painel.
  Hoje não existe forma de sair — a sessão só termina por expiração ou por limpeza manual
  do navegador, o que é inaceitável em computador partilhado. Terminar a própria sessão
  MUST NOT exigir estar na lista de administradores: quem detém a sessão pode encerrá-la.

**Proteção do transporte e do navegador**

- **FR-022**: O sistema MUST instruir o navegador a comunicar apenas por ligação segura.
- **FR-023**: O sistema MUST impedir que o site seja embutido em páginas de terceiros.
- **FR-024**: O sistema MUST restringir de que origens o navegador pode carregar
  recursos, mantendo funcionais o mapa, as imagens do catálogo, os ícones e a recolha de
  estatísticas de visita já existentes.
- **FR-025**: O sistema MUST limitar a informação de proveniência enviada a terceiros na
  navegação a partir do site.

**Fronteira de segredos**

- **FR-026**: A credencial de acesso privilegiado ao armazém de dados MUST ficar
  restrita a código que corre no servidor e MUST ser inacessível a partir de qualquer
  código enviado ao navegador.
- **FR-027**: As páginas públicas MUST ler dados com privilégio mínimo, de forma que as
  regras de acesso do armazém de dados continuem a funcionar como rede de segurança
  também no servidor.
- **FR-028**: O sistema MUST ter uma verificação automática que falhe a construção da
  aplicação caso código destinado ao navegador passe a depender da credencial
  privilegiada.

**Mensagens ao utilizador**

- **FR-029**: Todas as mensagens de recusa MUST ser em português do Brasil, claras, e
  MUST NOT expor detalhes internos do armazém de dados.

### Key Entities

- **Administrador**: representa a autorização de uma conta para gerir o catálogo.
  Referencia uma conta de autenticação existente e regista desde quando tem o poder.
  Ser administrador é uma inclusão explícita nesta lista; não decorre de nenhum outro
  atributo da conta.
- **Produto**: item do catálogo. Já existe. Passa a ter a sua visibilidade pública
  determinada pelo estado de disponibilidade, aplicada pelo próprio armazém de dados e
  não apenas pelas consultas da aplicação.
- **Foto de Produto**: imagem associada a um produto, guardada no armazenamento. Passa a
  ter tipo e tamanho restritos, nome gerado pelo sistema, e uma associação ao produto
  que permite localizá-la sem interpretar o seu endereço público.
- **Tentativa de Entrada**: registo das tentativas falhadas por origem, usado para
  travar temporariamente quem insiste. Existe apenas o tempo necessário para essa
  decisão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma conta autenticada fora da lista de administradores obtém 0 escritas
  bem-sucedidas em 100 % das tentativas de criar, alterar ou remover produtos e
  ficheiros — medido por testes automatizados que reproduzem a cadeia de ataque
  confirmada na auditoria.
- **SC-002**: A cadeia de ataque documentada na auditoria de 2026-07-25 deixa de ser
  reproduzível em qualquer um dos seus seis passos.
- **SC-003**: Um visitante anónimo continua a completar o percurso de descoberta —
  chegar ao site, ver o catálogo, abrir um produto, iniciar a conversa de compra — sem
  qualquer passo adicional face a hoje.
- **SC-004**: 0 produtos indisponíveis são obtíveis por um visitante anónimo, incluindo
  por pedido direto à interface de dados.
- **SC-005**: 100 % dos envios de ficheiros que não sejam imagem, ou que excedam 5 MB,
  são recusados — testado também com ficheiros deliberadamente renomeados para
  contornar a verificação por extensão.
- **SC-006**: A dona consegue adicionar ou remover um administrador em menos de 5
  minutos, sem alterar código e sem um novo lançamento da aplicação.
- **SC-007**: Após 5 tentativas falhadas consecutivas, 100 % das tentativas seguintes da
  mesma origem são travadas durante 15 minutos; à 5.ª falha o bloqueio já está ativo, e
  uma entrada correta antes disso repõe a contagem.
- **SC-008**: 0 ficheiros destinados ao navegador dependem da credencial privilegiada —
  verificado automaticamente a cada construção da aplicação.
- **SC-009**: O tempo de carregamento percebido do site público não piora face à medição
  atual.
- **SC-010**: Toda a alteração às regras de acesso tem um teste automatizado associado
  que prova que o acesso não autorizado é **negado** — não apenas que o acesso
  autorizado funciona.

## Assumptions

- Existe hoje exatamente uma conta no sistema de autenticação, pertencente à dona, e é
  essa que passa a constar da lista de administradores.
- O catálogo continua sem contas de cliente: visitantes nunca se autenticam, e a venda
  continua a fechar por conversa de WhatsApp. Fechar o registo público não afeta,
  portanto, nenhum percurso de cliente.
- O número de administradores permanece pequeno — uma pessoa, eventualmente duas ou
  três. Não é necessário um sistema de papéis com vários níveis; uma lista de
  inclusão chega.
- O limite de 5 MB por imagem alinha com o limite já praticado hoje na interface de
  envio, pelo que não altera o que a dona consegue carregar na prática.
- Remover uma conta da lista tem efeito no pedido seguinte. Não é requisito terminar
  imediatamente sessões já abertas, porque a verificação de autorização corre a cada
  operação de escrita — uma sessão órfã não consegue escrever.
- A interface do painel mantém-se visualmente como está nesta fase. O redesenho e a
  reconstrução do painel pertencem às fases seguintes e não devem ser antecipados aqui.
- As imagens de produto continuam a ser servidas publicamente, sem autenticação — é o
  comportamento pretendido para uma vitrine.
- A verificação do tipo real do ficheiro é feita pela assinatura do conteúdo, o que
  cobre os formatos de imagem em uso; não é requisito analisar o interior da imagem à
  procura de conteúdo malicioso embutido.
- Os valores de 5 tentativas e 15 minutos de bloqueio são o padrão corrente da indústria
  para painéis de administração de baixo volume. Com uma única administradora, o risco
  de bloquear alguém legítimo é desprezável, e o valor é ajustável sem alterar esta
  especificação.
- O bloqueio por tentativas é contado por origem do pedido. Numa plataforma sem servidor
  persistente, isso implica guardar a contagem algures — a escolha desse mecanismo é uma
  decisão de implementação e pertence ao plano, não a esta especificação.

## Dependências e Ações Externas

- **Ação manual necessária**: o fecho do registo público de contas é uma definição do
  serviço de autenticação e é feita na sua consola de administração, não por código.
  Tem de ser executada pela dona. Esta é a mitigação mais rápida disponível e quebra a
  cadeia de ataque sozinha.
- A criação de novas contas de administrador passa a depender dessa mesma consola.
- As restrições de tipo e tamanho no serviço de armazenamento são definições desse
  serviço e acompanham as verificações feitas na aplicação.

## Fora de Âmbito

Explicitamente não pertencem a esta fase, para evitar que o trabalho se alargue:

- Redesenho visual do site ou do painel. **Exceção declarada**: as correções de feedback
  ao utilizador exigidas pelo Princípio V da constituição — substituir o diálogo nativo do
  navegador por estado no componente, e acrescentar ficheiros de erro e de carregamento às
  rotas — entram nesta fase. São baratas, estão no caminho já tocado pela migração das
  escritas, e deixá-las de fora obrigaria a mexer duas vezes nos mesmos ficheiros. Não
  alteram a aparência do painel.
- Substituição da biblioteca de componentes de interface.
- Conteúdo tridimensional e animação de deslocamento.
- Campos novos no produto, incluindo ordem manual e destaque.
- Gestão dos textos institucionais do site pelo painel.
- Paginação, pesquisa ou ordenação processadas no servidor.
- Autenticação em dois passos.
- Registo de auditoria de quem alterou o quê.
