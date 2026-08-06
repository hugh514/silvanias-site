# Contrato — Ações de Servidor (CMS e extensões de produto)

**Feature**: Painel, Conteúdo do Site e SEO
**Data**: 2026-08-06

Complementa [contracts/server-actions.md](../../001-seguranca-acesso-admin/contracts/server-actions.md)
da Fase 1. Este ficheiro cobre: (1) extensão das actions de produto com `ordem` /
`destaque`; (2) actions novas de `conteudo_site`.

---

## Invariantes comuns

Toda a ação que escreve cumpre esta ordem, sem exceção:

| # | Passo | Se falhar |
|---|-------|-----------|
| 1 | Obter a sessão do pedido | erro de não autenticado (PT-BR) |
| 2 | Verificar `is_admin()` | erro de não autorizado (PT-BR) |
| 3 | Validar entrada com schema zod partilhado | `camposComErro` por campo |
| 4 | Executar a escrita | erro genérico PT-BR (sem detalhe Postgres) |
| 5 | Revalidar caminhos afetados | — |

**Nenhuma ação recebe o identificador de quem chama como argumento.** Identidade vem
da sessão.

### Diferença CMS vs produtos na escrita (passo 4)

| Domínio | Cliente após passo 2 | Motivo |
|---------|----------------------|--------|
| `produtos` | cliente de sessão (`createClient`) — policies `is_admin()` | padrão Fase 1 |
| `conteudo_site` | `createAdminClient()` **somente depois** do passo 2 | decisão de produto fechada (D3) |

RLS de `conteudo_site` continua a negar mutações a não-admin na API direta — rede de
segurança independente.

---

## Forma do resultado

Igual à Fase 1:

| Campo | Quando |
|-------|--------|
| `ok: true` | sucesso (payload opcional) |
| `ok: false`, `erro` | falha genérica ou autorização |
| `ok: false`, `camposComErro` | validação |

Toasts no cliente disparam apenas quando `ok: true` regressa da action (Sonner).

---

## Extensão — `criarProduto` / `atualizarProduto`

**Entrada adicional** (FormData ou campos):

| Campo | Tipo | Notas |
|-------|------|-------|
| `ordem` | string numérica → int | default `0` se ausente |
| `destaque` | `'sim'` / ausente → boolean | default `false` |

**Comportamento**: após validação, persistir nas colunas novas. Revalidar
`/admin/produtos`, `/`, e `/produtos/[id]` quando aplicável.

**Recusa**: além das da Fase 1 — `ordem` não inteira; fora do intervalo do schema.

**Não muda**: upload de fotos, limites, limpeza de órfãos.

---

## `guardarConteudoSite`

**Ficheiro**: `lib/actions/conteudo-site.ts`

**Entrada**: `chave` (enum das cinco chaves) + documento JSON da chave (FormData com
campos planos ou JSON string validado).

**Comportamento**:

1. Invariantes 1–2.
2. Validar `chave` ∈ {`hero`,`marquee`,`quem_somos`,`onde_encontrar`,`rodape`}.
3. Validar `conteudo` com o schema zod da chave ([data-model.md](../data-model.md)).
4. `createAdminClient()` → `upsert` em `conteudo_site` (`onConflict: chave`),
   atualizando `atualizado_em` (via trigger ou valor explícito).
5. `revalidatePath('/')` (e caminhos admin de conteúdo).

**Recusa**: sem sessão; não admin; chave desconhecida; JSON inválido; falha de escrita
(mensagem genérica).

**Não faz**: upload de imagens; delete de chaves (as cinco são permanentes nesta
feature).

---

## `obterConteudoSite` (opcional, server-only)

Leitura tipada para RSC/admin. Pode ser função em `lib/conteudo/carregar-conteudo.ts`
em vez de action — **não** precisa de `is_admin` para leitura pública.

**Comportamento**: `createClient()` (chave publicável) → `select` por chave. Se linha
ausente ou JSON falhar parse/schema, devolver **fallback** igual ao seed / constantes,
sem lançar para o visitante.

---

## Autorização — matriz mínima de testes

| Ator | `atualizarProduto` (ordem/destaque) | `guardarConteudoSite` | `SELECT conteudo_site` |
|------|-------------------------------------|------------------------|-------------------------|
| Anónimo | NEGA | NEGA | PERMITE |
| Autenticado não-admin | NEGA | NEGA | PERMITE |
| Admin | PERMITE | PERMITE | PERMITE |
| Pedido direto PostgREST (não-admin JWT) INSERT/UPDATE/DELETE `conteudo_site` | — | — | NEGA (RLS) |

Cada célula NEGA MUST ter teste de integração (FR-024).

---

## Revalidação

| Action | Paths |
|--------|-------|
| criar/atualizar/remover produto | `/admin/produtos`, `/`, `/produtos/[id]?` |
| guardarConteudoSite | `/`, `/admin/conteudo` |
