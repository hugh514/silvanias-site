# Pesquisa — Fase 0

**Feature**: Segurança de Acesso ao Painel Administrativo
**Data**: 2026-07-25

Decisões técnicas tomadas antes do desenho. Cada uma regista o que foi escolhido, porquê,
e o que foi rejeitado.

---

## D1 — Sequência de aplicação sem janela de exposição nem painel partido

**Contexto**: a restrição levantada no pedido era que aplicar as políticas de acesso
antes de migrar as escritas partiria o painel, e migrar as escritas primeiro deixaria a
brecha aberta durante o intervalo.

**Decisão**: aplicar as migrações de base de dados **primeiro**, isoladas de qualquer
alteração de código.

**Rationale**: a premissa do dilema está errada, e verificá-lo mudou o plano. As escritas
do painel hoje partem do navegador com o JWT da dona. Assim que a dona constar da tabela
`admins`, `is_admin()` devolve verdadeiro para ela, e as políticas novas — que exigem
`is_admin()` — continuam a aceitar exatamente as mesmas escritas que aceitavam antes.
O painel não parte. Para toda a gente que não é ela, a escrita passa a ser recusada.

Ou seja, a migração é retrocompatível com o código atual. Isso permite fechar a brecha
num passo pequeno, reversível e independente, e migrar para Server Actions depois, sem
pressa e sem janela.

**Sequência**:

| # | Passo | Efeito na brecha | Efeito no painel |
|---|-------|------------------|------------------|
| 0 | Fechar registo público na consola (manual, pela dona) | Corta o primeiro degrau | Nenhum |
| 1 | Migrações: `admins`, `is_admin()`, políticas por comando, limites do bucket | **Fecha a brecha** | Nenhum — a dona já está na lista |
| 2 | Verificar com as sondas da auditoria que a cadeia deixou de reproduzir | — | — |
| 3 | `server-only` + separar `server.ts` (chave publicável) de `admin.ts` (chave de serviço) | Reforça | Nenhum |
| 4 | Autorização no proxy, restrita a `/admin` | Reforça | Nenhum |
| 5 | Server Actions + zod + validação de upload | Reforça | Substitui a escrita do navegador |
| 6 | Limitação de tentativas de entrada | Reforça | Login passa a Server Action |
| 7 | Cabeçalhos, primeiro em modo de observação | Reforça | Nenhum, se bem feito |
| 8 | Testes e integração contínua | Prova | — |

**Reversão**: se o painel deixar de escrever depois do passo 1, a correção é **adicionar o
utilizador em falta a `admins`**, nunca afrouxar a política. Uma migração de reversão que
reponha `FOR ALL TO authenticated` seria repor a vulnerabilidade e não deve existir.

**Alternativas rejeitadas**: fazer tudo num único lançamento — maior superfície de falha,
e adia o fecho da brecha até o resto estar pronto. Migrar as escritas primeiro — deixaria
a brecha aberta durante mais tempo sem qualquer ganho.

---

## D2 — Limitação de tentativas de entrada sem estado persistente

**Contexto**: FR-020 exige travar 5 tentativas falhadas por origem durante 15 minutos. A
plataforma de execução não mantém estado entre invocações.

**Decisão**: tabela `tentativas_login` no Postgres já existente, contando por endereço de
origem, manipulada exclusivamente por uma função `security definer`. O login passa a
Server Action, que consulta e incrementa a contagem antes de tentar autenticar.

**Rationale**: não acrescenta fornecedor nem custo. Há uma administradora e o volume
legítimo é de unidades por semana — a preocupação com contenção de escrita em Postgres
não se aplica a esta escala. A base de dados já é dependência crítica; se estiver em
baixo, o login não funciona de qualquer forma, portanto não se introduz um novo ponto de
falha.

**Alternativas rejeitadas**:
- `@upstash/ratelimit` — é o padrão da plataforma e tecnicamente superior em escala, mas
  acrescenta um fornecedor, uma conta e um segredo para gerir, para proteger o acesso de
  uma pessoa. Desproporcionado. Reavaliar se o número de administradores crescer muito.
- Confiar apenas nos limites nativos do serviço de autenticação — existem, mas não são
  observáveis nem ajustáveis por nós, e não permitem satisfazer FR-020 de forma testável.

**Nota de limpeza**: as linhas expiram; incluir remoção das entradas com mais de 24 h,
para a tabela não crescer indefinidamente.

---

## D3 — Verificação de administrador no middleware

**Decisão**: chamar `is_admin()` no middleware, e **restringir o middleware às rotas
`/admin`** — hoje corre em todas as rotas do site.

**Rationale**: correção acima de micro-otimização. Uma consulta por pedido a `/admin` é
irrelevante num painel de uso ocasional, e garante que a revogação tem efeito imediato
(FR-005), coisa que uma reivindicação embutida no token não garante.

Restringir o alcance é, além disso, um ganho de desempenho para o site público: hoje o
middleware corre — e faz uma chamada de rede ao serviço de autenticação — em **todas** as
visitas à vitrine, que nem sequer precisam de sessão. Tirá-lo do caminho crítico melhora
o tempo de carregamento percebido, o que serve SC-009 e o Princípio II.

**Alternativas rejeitadas**: reivindicação `is_admin` no token via gancho de autenticação
— zero consultas, mas o token vive até renovar (por omissão uma hora), e durante esse
tempo um administrador removido continuaria a entrar. Viola FR-005. Reavaliar apenas se o
custo da consulta se tornar mensurável.

**Defesa em profundidade**: o middleware é conveniência de encaminhamento, não a fronteira
de segurança. As políticas de acesso e a verificação dentro das Server Actions são as
fronteiras reais. Um middleware contornado não deve dar poder de escrita a ninguém.

---

## D4 — Localizar ficheiros no armazenamento sem interpretar o endereço público

**Contexto**: FR-019. Hoje `ProdutoForm.tsx:130` faz `url.split("/produtos/").pop()`, que
parte se o nome do ficheiro contiver `/produtos/`.

**Decisão**: manter a coluna `fotos` com os endereços públicos, e derivar o caminho
recortando pelo prefixo completo de armazenamento, não pelo fragmento `/produtos/`.
Combinado com nomes de ficheiro totalmente gerados pelo sistema, deixa de existir
conteúdo controlado pelo utilizador no caminho.

**Rationale**: resolve a fragilidade sem alterar o esquema. A vitrine já consome os
endereços públicos diretamente e não teria de mudar. O prefixo completo é suficientemente
específico para não colidir, e a partir do momento em que os nomes são gerados por nós, a
entrada hostil deixa de existir na prática.

**Alternativas rejeitadas**: coluna nova com os caminhos — mais correto em teoria, mas
implica migração de dados das linhas existentes e a especificação exclui campos novos
nesta fase. Registar como candidato à Fase 2, quando o esquema for mexido de qualquer
forma para ordem manual e destaque.

---

## D5 — Fronteira de segredos verificada na construção

**Decisão**: pacote `server-only` (0.0.1) importado no topo de `lib/supabase/admin.ts`.

**Rationale**: é a solução canónica do framework e satisfaz FR-028 diretamente — se um
ficheiro destinado ao navegador importar o módulo, a construção falha com erro explícito.
Não exige regra de análise estática à medida nem teste próprio. Custo: uma dependência de
tamanho desprezável, cujo único conteúdo é provocar esse erro.

**Estado**: não instalado. Requer `npm install server-only`.

**Alternativas rejeitadas**: regra `no-restricted-imports` no analisador — não consegue
distinguir de forma fiável ficheiros de navegador de ficheiros de servidor, porque a
diretiva `"use client"` é conteúdo do ficheiro e não caminho. Daria falsos positivos e
negativos.

---

## D6 — Política de origens de recursos

**Contexto**: FR-024 exige restringir origens sem partir o que já funciona.

**Origens realmente em uso**, levantadas do código:

| Diretiva | Origem | Porquê |
|----------|--------|--------|
| `frame-src` | `https://www.google.com` | mapa embutido em `OndeNosEncontrar.tsx:69` |
| `img-src` | `'self'`, `data:`, `https://khfebjavstjyzfhxwmvm.supabase.co` | fotos de produto |
| `connect-src` | `'self'`, o mesmo domínio de armazenamento, `https://api.iconify.design` | dados e ícones |
| `script-src` | `'self'`, `https://va.vercel-scripts.com` | recolha de estatísticas |

Ligações para `https://wa.me` e `https://instagram.com` são navegação por hiperligação, não
carregamento de recursos — não precisam de diretiva.

**Decisão**: publicar primeiro em modo de observação, recolher violações reais durante
alguns dias de tráfego, e só depois passar a modo de bloqueio.

**Rationale**: uma política mal calibrada parte o site em silêncio para o visitante, sem
erro visível ao programador. O modo de observação reporta sem bloquear. Dado que SC-003
exige que o percurso do visitante não se altere, arriscar bloqueio direto é imprudente.

**Achado colateral, fora de âmbito nesta fase**: a biblioteca de ícones é usada em nove
ficheiros e vai buscar cada ícone a `api.iconify.design` **em tempo de execução, no
navegador do visitante**. Isso é um terceiro no caminho crítico de renderização, um pedido
de rede por ícone, e uma dependência externa que, se cair, degrada o site. Candidato forte
a substituição por ícones locais na Fase 2 ou 3. Não mexer agora — trocar nove ficheiros de
ícones no meio de uma alteração de segurança mistura riscos sem necessidade.

---

## D7 — Ambiente de testes isolado

**Contexto**: o Princípio VI exige um teste que prove que o acesso não autorizado é
negado. Esse teste cria utilizadores e tenta escritas — não pode correr contra produção.

**Descoberta**: o Docker está instalado (29.3.1) mas o serviço **não está acessível** nesta
máquina. O Podman (5.8.1) está disponível. A ferramenta de linha de comandos do Supabase
não está instalada.

**Decisão**: ambiente local com a ferramenta de linha de comandos do Supabase, apontada ao
Podman através da variável de ambiente de socket. Se isso se revelar frágil, recuar para um
segundo projeto Supabase gratuito dedicado a testes.

**Rationale**: o ambiente local dá reposição instantânea entre execuções e não custa nada.
A alternativa remota é mais lenta e exige gerir mais um conjunto de segredos, mas funciona
sem dependência de contentores e é o caminho garantido para a integração contínua.

**Risco assumido**: esta é a peça do plano com maior probabilidade de exigir ajuste durante
a execução. Se o ambiente local custar mais de uma hora a pôr de pé, mudar para o projeto
dedicado sem hesitar — o objetivo é ter o teste de acesso negado a correr, não ter um
ambiente local bonito.

**Regra absoluta**: nenhum teste automatizado aponta para o projeto de produção. A
configuração de teste deve recusar-se a arrancar se detetar o identificador do projeto de
produção.

---

## D8 — Verificação do tipo real do ficheiro

**Decisão**: comparar os primeiros bytes do ficheiro com as assinaturas conhecidas de
JPEG, PNG, WebP e AVIF, em código próprio, sem dependência nova.

**Rationale**: são quatro formatos com assinaturas curtas e estáveis. Uma biblioteca
genérica de deteção traria centenas de formatos que não queremos aceitar — mais superfície
por nenhum ganho. O código são poucas linhas e é diretamente testável em teste unitário,
que é onde o Princípio VI quer o esforço.

**Complemento**: as restrições configuradas no próprio serviço de armazenamento (FR-016)
são a segunda camada, e cobrem o caso de alguém chamar o armazenamento diretamente sem
passar pela aplicação.

---

## D9 — Versões a instalar

Confirmadas em 2026-07-25. Compatibilidade com React 19 verificada nas dependências
declaradas de cada pacote.

| Pacote | Versão | Papel |
|--------|--------|-------|
| `server-only` | 0.0.1 | fronteira de segredos verificada na construção |
| `zod` | 4.4.3 | esquemas partilhados de validação |
| `vitest` | 4.1.10 | testes unitários e de integração |
| `@playwright/test` | 1.62.0 | testes de percurso completo |
| `supabase` (linha de comandos) | 2.109.1 | migrações, tipos gerados, ambiente local |

Nenhuma destas entra no pacote enviado ao navegador, exceto `zod`, que entra apenas nas
partes de validação partilhadas.

---

## Questões deixadas em aberto para a execução

1. Se o ambiente local de base de dados não subir com Podman em tempo razoável, mudar para
   projeto dedicado (D7). Decisão a tomar durante a execução, não agora.
2. O valor exato do período de observação da política de origens depende do tráfego real.
   Propor uma semana e reavaliar com os dados.

---

# Registo da execução — 2026-07-25

O que só se soube ao fazer. Registado aqui porque contradiz coisas afirmadas acima.

## D10 — Vulnerabilidades nas dependências (não previsto no plano)

Ao instalar as dependências novas, o auditor do gestor de pacotes reportou **12
vulnerabilidades de severidade alta**. Não estava no âmbito, mas uma delas cruza-se
diretamente com esta feature.

| Pacote | Problema | Risco neste projeto |
|--------|----------|---------------------|
| `sharp` < 0.35.0 | CVEs herdadas do libvips: CVE-2026-33327, -33328, -35590, -35591 | **Real.** O otimizador de imagens do framework usa `sharp`, e este site serve imagens **carregadas por utilizadores**. Validar a assinatura do ficheiro não serve de nada se o processador a jusante tem falha conhecida |
| `postcss` ≤ 8.5.17 | leitura arbitrária de ficheiros por `sourceMappingURL` | Baixo — só em construção, exige folha de estilo controlada por atacante |
| `minimatch` / `brace-expansion` | negação de serviço por expansão sem limite | Nenhum em produção — cadeia do analisador estático, só desenvolvimento |

**Erro cometido e corrigido**: assumi que subir de 16.2.10 para 16.2.11 resolveria, e
disse-o antes de verificar. Não resolveu — as 12 mantiveram-se. O `sharp` e o `postcss`
são dependências transitivas do framework, e a sugestão automática do gestor de pacotes
era descer para uma versão de 2020, o que é absurdo.

**Decisão**: forçar `sharp` para 0.35.3 por substituição de versão declarada, apesar de o
framework pedir `^0.34.5`. É um salto menor e a interface usada não mudou. Construção e
otimização de imagens verificadas depois da mudança.

**Resultado**: as CVEs do libvips desapareceram. Restam 10, todas em desenvolvimento
(cadeia do analisador) ou em construção (`postcss`), nenhuma no caminho de execução em
produção. Resolver a cadeia do analisador exige um salto maior de versão e fica para
quando houver motivo próprio.

## D5 revisto — o alcance real do `server-only`

O plano afirmava que `server-only` satisfaz FR-028 por si. **Verificação mostrou que
protege menos do que eu tinha escrito.**

Primeira tentativa de violar a fronteira: criar um ficheiro de cliente que importa o
módulo com a credencial de serviço. **A construção passou.** O ficheiro não era importado
por nada, portanto nunca entrou no grafo de compilação do cliente.

Segunda tentativa, injetando o mesmo import num componente realmente em uso: a construção
falhou, com a mensagem esperada — `'server-only' cannot be imported from a Client
Component module`.

**Conclusão**: `server-only` só atua sobre ficheiros que chegam mesmo ao pacote do
navegador. Um ficheiro órfão passa despercebido e fica como armadilha para o dia em que
alguém o ligar a uma página.

**Mitigação acrescentada**: análise estática em `tests/unit/fronteira-segredos.test.ts`,
que percorre todos os ficheiros independentemente de serem alcançáveis, mais a mesma
verificação na integração contínua. Verificada por mutação: falha quando a violação
existe, passa quando não existe.

## D7 resolvido — o ambiente local subiu

Socket do Podman via `systemctl --user start podman.socket`; `DOCKER_HOST` apontado ao
socket. O descarregamento das imagens demorou o grosso do tempo (~130 KB/s), mas concluiu.
**Doze contentores a correr, migrações aplicadas de raiz, 26 testes de integração a passar.**

Não foi preciso recuar para projeto dedicado. O limite de uma hora não chegou a ser
atingido para a parte que dependia de decisão — o que demorou foi rede, não configuração.

---

# Quatro defeitos que só o ambiente real revelou

Nenhum destes seria apanhado por revisão de código. Todos teriam ido para produção.

## Defeito 1 — a tabela `produtos` nunca esteve versionada

Primeiro arranque limpo falhou com `relation "public.produtos" does not exist`.

A tabela foi criada à mão pela consola. Produção tinha-a; o repositório não. Consequências:
nenhum ambiente novo podia ser construído a partir do código, não havia forma de testar sem
tocar em produção, e o esquema real não estava documentado em lado nenhum verificável.

**Correção**: migração `0000_baseline_produtos.sql`, com `if not exists` — inofensiva em
produção, indispensável em qualquer ambiente novo.

## Defeito 2 — `[auth.email] enable_signup = false` desliga o LOGIN

Ao fechar o registo, pus a chave a `false` nas duas secções da configuração. Os testes
falharam com `Email logins are disabled`.

Essa chave **não** significa "permitir registo por email". Mapeia para
`GOTRUE_EXTERNAL_EMAIL_ENABLED` e, a `false`, desliga a autenticação por email por
completo — ninguém entra, nem quem já tem conta. Quem fecha o registo sem partir o login é
`enable_signup` na secção `[auth]`.

**Se tivesse ido para produção, ninguém entrava no painel.**

## Defeito 3 — `revoke all from public` cortou também a `service_role`

As funções de contagem de tentativas devolviam `null` em vez de executar. `revoke all ...
from public` remove a concessão implícita a **todos** os papéis, incluindo aquele com que o
servidor da aplicação corre.

Efeito: a limitação de tentativas deixaria de funcionar **em silêncio**. Falha aberta — a
pior espécie, porque nada indica que algo está errado.

**Correção**: `grant execute ... to service_role` explícito.

## Defeito 4 — o mais grave: `is_admin()` sem execução para `anon`

O teste `disponiveis_continuam_visiveis_a_anonimo` falhou: um visitante anónimo não via
**nenhum** produto.

A política de leitura é `disponivel is true or public.is_admin()`, avaliada com os
privilégios de quem consulta. Eu tinha revogado a função de todos e concedido só a
`authenticated`, com o raciocínio de que um anónimo nunca pode ser administrador. O
raciocínio estava certo; a conclusão estava errada — a função tem de poder **correr** para
devolver falso.

**Teria fechado a vitrine ao público.** Trocaria uma falha de segurança por uma falha de
negócio pior: catálogo protegido, e invisível.

Foi apanhado porque a História 5 ("o visitante não nota diferença") foi posta em prioridade
máxima **ao lado** da História 1, na mesma fase, em vez de a seguir. Se a verificação de
não regressão tivesse ficado para depois de publicar, o estrago aparecia em produção.

**Correção**: `grant execute on function public.is_admin() to anon, authenticated`.
Conceder é inofensivo — para um anónimo `auth.uid()` é nulo e o resultado é sempre falso,
e a tabela `admins` continua ilegível porque a função devolve apenas um booleano.

## Defeito 5 — privilégios de tabela nunca versionados

`permission denied for table produtos`, e depois o mesmo para `admins`. Tabelas criadas
pela consola recebem concessões automáticas a `anon`, `authenticated` e `service_role`;
criadas por migração, não recebem nada.

O modelo de privilégios existia apenas como efeito colateral da consola. Agora está escrito
em 0000 e 0001, separado da camada de políticas: o privilégio diz se o papel pode tocar na
tabela, a política diz em que linhas.

## Desvio ao plano — onde ficaram os testes das ações

O plano previa os testes das ações de servidor em `tests/integration/`. Ficaram em
`tests/unit/acoes-produto.test.ts`, com dublês em vez de base de dados real.

**Motivo**: contra uma base real só se consegue ver a escrita a ser recusada. Com dublês
consegue-se afirmar o que interessa mesmo — que **nenhuma escrita chegou sequer a ser
tentada** quando a autorização falha. Além disso correm em milissegundos e sem ambiente,
o que significa que correm em cada alteração em vez de só quando há infraestrutura.

A prova de que as políticas da base de dados também negam continua onde estava, em
`tests/integration/acesso-negado.test.ts`, contra Supabase a sério.
