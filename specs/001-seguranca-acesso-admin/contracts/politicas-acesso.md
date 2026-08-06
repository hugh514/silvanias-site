# Contrato — Matriz de Acesso

**Feature**: Segurança de Acesso ao Painel Administrativo
**Data**: 2026-07-25

Este é o contrato central da feature. Cada célula é um caso de teste.

---

## Papéis

| Papel | Definição |
|-------|-----------|
| **Anónimo** | visitante sem sessão. É a esmagadora maioria do tráfego e o cliente do negócio |
| **Autenticado** | tem sessão válida mas **não** consta de `public.admins`. Depois desta feature, esta categoria só existe por engano ou por ataque |
| **Administrador** | tem sessão válida e consta de `public.admins` |
| **Serviço** | credencial privilegiada, usada apenas em código de servidor. Faz desvio a todas as políticas |

---

## `public.produtos`

| Operação | Anónimo | Autenticado | Administrador | Requisito |
|----------|---------|-------------|---------------|-----------|
| Ler produtos com `disponivel = true` | **PERMITE** | **PERMITE** | **PERMITE** | FR-010 |
| Ler produtos com `disponivel` falso ou nulo | **NEGA** | **NEGA** | **PERMITE** | FR-011, FR-012 |
| Criar | **NEGA** | **NEGA** | **PERMITE** | FR-002 |
| Alterar | **NEGA** | **NEGA** | **PERMITE** | FR-002 |
| Remover | **NEGA** | **NEGA** | **PERMITE** | FR-002 |

**Políticas que o implementam**:

| Nome | Comando | Papéis | Condição |
|------|---------|--------|----------|
| `produtos_select_publico` | `select` | `anon`, `authenticated` | `disponivel is true or public.is_admin()` |
| `produtos_insert_admin` | `insert` | `authenticated` | verificação: `public.is_admin()` |
| `produtos_update_admin` | `update` | `authenticated` | uso e verificação: `public.is_admin()` |
| `produtos_delete_admin` | `delete` | `authenticated` | uso: `public.is_admin()` |

**Sobre a política de alteração ter uso *e* verificação**: sem a cláusula de verificação, um
administrador poderia alterar uma linha para um estado que a política já não permitiria. Com
as duas, a linha tem de satisfazer a condição antes e depois. Neste caso a condição não
depende de colunas da linha, mas a omissão seria um mau hábito a repetir na Fase 2, quando o
esquema crescer.

---

## `storage.objects`, contentor `produtos`

| Operação | Anónimo | Autenticado | Administrador | Requisito |
|----------|---------|-------------|---------------|-----------|
| Ler imagem | **PERMITE** | **PERMITE** | **PERMITE** | FR-010 |
| Enviar | **NEGA** | **NEGA** | **PERMITE** | FR-018 |
| Substituir | **NEGA** | **NEGA** | **PERMITE** | FR-018 |
| Remover | **NEGA** | **NEGA** | **PERMITE** | FR-018 |

**Leitura pública é intencional.** É uma vitrine; as fotos têm de carregar sem sessão. O
contentor mantém-se público para leitura.

**Restrições do contentor** (FR-016), segunda camada independente das políticas:

| Definição | Antes | Depois |
|-----------|-------|--------|
| `file_size_limit` | nulo, sem limite | `5242880` (5 MB) |
| `allowed_mime_types` | nulo, aceita tudo | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |

**Nota sobre SVG**: deliberadamente excluído. Um SVG é um documento que pode conter script,
e servido de um contentor público no domínio da marca torna-se um vetor de execução de
código com essa origem.

---

## `public.admins`

| Operação | Anónimo | Autenticado | Administrador | Serviço |
|----------|---------|-------------|---------------|---------|
| Ler | **NEGA** | **NEGA** | **NEGA** | permite |
| Escrever | **NEGA** | **NEGA** | **NEGA** | permite |

Segurança ao nível da linha ligada com zero políticas. Nem um administrador consegue
enumerar a lista pela interface de dados. Gestão pela consola ou por migração (FR-006).

---

## `public.tentativas_login`

Idêntico a `admins`: ligada, zero políticas, acessível apenas por funções com privilégio de
definidor. Quem está a tentar entrar não deve conseguir ler nem apagar o seu próprio rasto.

---

## Rotas da aplicação

| Rota | Anónimo | Autenticado | Administrador | Requisito |
|------|---------|-------------|---------------|-----------|
| `/` | **PERMITE** | **PERMITE** | **PERMITE** | FR-010 |
| `/produtos/[id]` de produto disponível | **PERMITE** | **PERMITE** | **PERMITE** | FR-010 |
| `/produtos/[id]` de produto indisponível | **não encontrado** | **não encontrado** | **PERMITE** | FR-011 |
| `/admin/login` | **PERMITE** | reencaminha | reencaminha para o painel | — |
| `/admin/*` | reencaminha para entrada | **reencaminha para entrada** | **PERMITE** | FR-008, FR-009 |

**A célula que muda o comportamento atual** é a do meio na última linha: hoje uma conta
autenticada qualquer entra no painel.

**Nota sobre o reencaminhamento de um autenticado não administrador**: vai para a página de
entrada, não para uma página de erro. Não deve confirmar a existência do painel a quem não
tem nada que ver com ele, pela mesma razão que as mensagens de entrada não revelam se um
endereço existe (FR-021).

---

## Fronteira de segredos

| Módulo | Credencial | Quem pode importar | Imposto por |
|--------|-----------|--------------------|-------------|
| `lib/supabase/client.ts` | publicável | qualquer código de navegador | — |
| `lib/supabase/server.ts` | **publicável** com cookies | componentes e ações de servidor | — |
| `lib/supabase/admin.ts` | **de serviço** | **apenas ações de servidor** | `server-only`, falha a construção |

**A mudança em `server.ts`** é o coração da correção do Princípio I: hoje usa a credencial
de serviço (linha 11), o que significa que **toda** a página de servidor corre com desvio às
políticas, incluindo a página pública de produto. Depois desta feature, uma página de
servidor que se esqueça de filtrar `disponivel` deixa de vazar produtos escondidos — a base
de dados impede-a.

---

## Casos de teste derivados

Cada linha marcada **NEGA** acima é um teste obrigatório pelo Princípio VI. Contagem mínima:

| Grupo | Testes |
|-------|--------|
| Produtos, escrita negada a autenticado não administrador | 3 (criar, alterar, remover) |
| Produtos, leitura de indisponível negada | 2 (anónimo, autenticado) |
| Armazenamento, escrita negada | 3 (enviar, substituir, remover) |
| Rotas, reencaminhamento | 2 (anónimo, autenticado não administrador) |
| Envio, tipo e tamanho recusados | 3 (tipo não permitido, acima de 5 MB, extensão que mente sobre o conteúdo) |
| Entrada, bloqueio e não enumeração | 2 |
| Percurso do visitante intacto | 3 (página inicial, página de produto, imagens) |
| Fronteira de segredos | 1 (construção falha se o navegador importar `admin.ts`) |

**Total mínimo: 19.** A suite que reproduz os seis passos da cadeia de ataque da auditoria
cobre a maioria e é a peça central de regressão.
