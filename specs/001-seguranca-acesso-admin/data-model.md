# Modelo de Dados — Fase 1

**Feature**: Segurança de Acesso ao Painel Administrativo
**Data**: 2026-07-25

---

## Entidades

### `public.admins` — NOVA

Lista de inclusão explícita. Pertencer a esta tabela é a **única** forma de obter poder de
administração. Não há nenhum atributo da conta de autenticação que confira esse poder por
si — é precisamente a suposição contrária que causou a vulnerabilidade.

| Coluna | Tipo | Restrições | Significado |
|--------|------|------------|-------------|
| `user_id` | `uuid` | chave primária, referencia `auth.users(id)`, `on delete cascade` | conta a quem é concedido o poder |
| `criado_em` | `timestamptz` | não nulo, por omissão `now()` | desde quando |

**Segurança ao nível da linha**: **ligada, com zero políticas**. A ausência de políticas é
deliberada e é o mecanismo: sem políticas, nenhum papel de aplicação lê ou escreve nesta
tabela através da interface de dados. Só a credencial de serviço, que faz desvio, e as
funções com privilégio de definidor lhe tocam.

**Consequência**: a lista de administradores não é enumerável por ninguém a partir do
exterior, nem sequer por um administrador. Gerir a lista é feito na consola ou por
migração.

**Regra de integridade**: a lista nunca deve ficar vazia. Não é imposta por restrição de
base de dados — uma restrição dessas impediria a remoção do último administrador mesmo
quando legítima. É imposta por procedimento, documentado no arranque rápido.

---

### `public.is_admin()` — NOVA função

```
is_admin() → boolean
```

Devolve se a conta do pedido atual consta de `public.admins`.

| Propriedade | Valor | Porquê |
|-------------|-------|--------|
| `language` | `sql` | consulta simples, permite ao planeador embutir |
| `stable` | sim | mesmo resultado dentro da mesma instrução; permite reutilizar o resultado nas políticas em vez de reavaliar por linha |
| `security definer` | sim | precisa de ler `public.admins`, cuja segurança ao nível da linha bloqueia todos os papéis de aplicação |
| `set search_path = ''` | sim | **crítico** numa função com privilégio de definidor. Sem isto, quem controlar o caminho de procura pode fazer sombra a `public.admins` com uma tabela própria e obter administração. Todos os nomes dentro da função são totalmente qualificados |

**Permissões**: revogar execução de `public`, conceder apenas a `authenticated`. Um
visitante anónimo nunca precisa de a chamar — não pode ser administrador.

**Uso de `(select auth.uid())`** em vez de `auth.uid()` direto: permite ao planeador
avaliar uma vez por instrução em vez de uma vez por linha. Diferença mensurável em
consultas de listagem.

---

### `public.produtos` — EXISTENTE, esquema inalterado

Confirmado por leitura do esquema real a 2026-07-25.

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `uuid` | chave primária |
| `nome` | `text` | não nulo |
| `categoria` | `text` | não nulo |
| `descricao` | `text` | nulo permitido |
| `ingredientes` | `text` | nulo permitido |
| `disponivel` | `boolean` | nulo permitido |
| `fotos` | `text[]` | nulo permitido |
| `created_at` | `timestamptz` | nulo permitido |

**O que muda**: nada no esquema. Muda quem lhe pode tocar, e passa a ser a própria base de
dados a impor a visibilidade pública em função de `disponivel`, em vez de depender de cada
consulta da aplicação se lembrar de filtrar.

**Nota sobre `disponivel` aceitar nulo**: a política de leitura usa `disponivel is true`,
não `disponivel <> false`. Um produto com `disponivel` nulo fica, portanto, **invisível ao
público** — que é o comportamento seguro por omissão. Um produto só aparece se alguém
disse explicitamente que está disponível.

**Regras de validação** aplicadas na fronteira da aplicação, não como restrições novas de
base de dados:

| Campo | Regra |
|-------|-------|
| `nome` | obrigatório, sem espaços nas pontas, 1 a 120 caracteres |
| `categoria` | obrigatório, tem de ser um dos valores de `CATEGORIAS` em `lib/constants.ts` |
| `descricao` | opcional, máximo 2000 caracteres, vazio guardado como nulo |
| `ingredientes` | opcional, máximo 1000 caracteres, vazio guardado como nulo |
| `disponivel` | booleano, por omissão verdadeiro |
| `fotos` | no máximo 4 endereços, cada um resultante de um envio validado |

---

### Foto de Produto — armazenamento, não tabela

Vive no contentor `produtos`. Não tem tabela própria; a associação ao produto é o vetor
`fotos`.

| Aspeto | Antes | Depois |
|--------|-------|--------|
| Nome do ficheiro | `{uuid}-{nome escolhido por quem envia}` | `{uuid}.{extensão derivada do tipo real detetado}` |
| Tipo aceite | qualquer — contentor sem restrição | apenas JPEG, PNG, WebP, AVIF |
| Tamanho | ilimitado no contentor | 5 MB, imposto no contentor e na aplicação |
| Quem envia | qualquer conta autenticada | apenas quem consta de `admins` |
| Localizar para remover | recorte por `/produtos/`, frágil | recorte pelo prefixo completo de armazenamento |

**Porquê descartar o nome escolhido**: o nome deixa de ser entrada de confiança. Combinado
com a extensão derivada do conteúdo real e não do que foi declarado, remove de uma vez o
percurso entre pastas, a colisão de nomes, os caracteres problemáticos, e a discrepância
entre extensão e conteúdo.

**Assinaturas de conteúdo verificadas** (D8):

| Formato | Bytes iniciais |
|---------|----------------|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| WebP | `52 49 46 46` nos bytes 0-3 e `57 45 42 50` nos bytes 8-11 |
| AVIF | `66 74 79 70` nos bytes 4-7, seguido de marca de formato `avif` ou `avis` |

**Órfãos**: se a gravação do produto falhar depois de alguns ficheiros já terem subido, os
ficheiros já enviados são removidos antes de devolver o erro. Caso contrário acumula-se
lixo que ocupa espaço sem produto associado — apontado nos casos limite da especificação.

---

### `public.tentativas_login` — NOVA

Suporta FR-020. Existe apenas o tempo necessário para decidir se bloqueia.

| Coluna | Tipo | Restrições | Significado |
|--------|------|------------|-------------|
| `id` | `bigint` | chave primária, gerada | — |
| `origem` | `text` | não nulo, indexado | endereço de origem do pedido |
| `ocorrido_em` | `timestamptz` | não nulo, por omissão `now()`, indexado | quando |

**Segurança ao nível da linha**: ligada, com zero políticas. Mesmo raciocínio de `admins`.
Só funções com privilégio de definidor lhe tocam. Um atacante não deve conseguir ler
quantas tentativas já fez, nem apagar o seu próprio rasto.

**Funções associadas**, ambas com privilégio de definidor e caminho de procura vazio:

| Função | Papel |
|--------|-------|
| `registar_tentativa_falhada(origem text)` | grava uma falha |
| `entrada_bloqueada(origem text) → boolean` | verdadeiro se houver 5 ou mais falhas nos últimos 15 minutos |
| `limpar_tentativas(origem text)` | apaga as falhas dessa origem após entrada bem-sucedida |

**Retenção**: as entradas com mais de 24 horas são removidas. Sem isto a tabela cresce sem
limite. A remoção acontece de forma oportunista dentro de `registar_tentativa_falhada`,
evitando depender de um agendador — proporcional ao volume deste projeto.

**Nota sobre a granularidade**: contar por endereço de origem trava o caso realista, que é
um automatismo a partir de um único ponto. Não trava um ataque distribuído por muitos
pontos. Contra esse, a defesa é a política de palavra-passe e o facto de o registo público
estar fechado, não a contagem.

---

## Transições de Estado

Não há máquinas de estado nesta feature. As duas transições relevantes são de autorização e
são instantâneas:

| Transição | Gatilho | Efeito | Latência |
|-----------|---------|--------|----------|
| Conta ganha administração | inserção em `admins` | passa a escrever e a ver produtos indisponíveis | pedido seguinte |
| Conta perde administração | remoção de `admins` | deixa de escrever e de ver indisponíveis | pedido seguinte |

A latência de um pedido é consequência de `is_admin()` ser avaliada em cada operação, e não
lida de um token de longa duração. Satisfaz FR-005 e é o motivo pelo qual a reivindicação
embutida no token foi rejeitada em D3.

---

## Relações

```
auth.users
    │
    │ 1 ── 0..1
    ▼
public.admins ──── consultada por ────► public.is_admin()
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
              políticas de           políticas de          verificação nas
              public.produtos        storage.objects       ações de servidor
```

As três consumidoras de `is_admin()` são camadas independentes sobre a mesma verdade. Uma
falha na camada de aplicação não abre a base de dados; uma política mal escrita ainda
encontra a verificação da ação de servidor à frente.
