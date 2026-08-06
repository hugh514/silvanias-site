# Modelo de Dados — Fase 1

**Feature**: Painel, Conteúdo do Site e SEO
**Data**: 2026-08-06

---

## Entidades

### `public.produtos` — EXISTENTE, estendido

Colunas atuais mantidas. Acrescentar:

| Coluna | Tipo | Restrições | Significado |
|--------|------|------------|-------------|
| `ordem` | `integer` | `NOT NULL DEFAULT 0` | posição no catálogo público (menor = primeiro) |
| `destaque` | `boolean` | `NOT NULL DEFAULT false` | marca de destaque na vitrine |

**Migração**: `supabase/migrations/0005_ordem_destaque.sql`

**Ordenação pública canónica**:

```sql
order by ordem asc, created_at desc
```

Aplicada em `CatalogoSection` (e qualquer listagem pública equivalente). O painel pode
ordenar de outra forma na tabela (ex.: por nome), mas a gravação persiste `ordem` /
`destaque` conforme o formulário.

**RLS**: inalterada em estrutura (políticas por comando da Fase 1). As novas colunas
herdam as mesmas regras: SELECT público se `disponivel is true` (ou admin); mutação só
`is_admin()`.

**Validação na fronteira** (`lib/schemas/produto.ts`):

| Campo | Regra |
|-------|-------|
| `ordem` | inteiro, obrigatório, intervalo razoável (ex.: -9999..9999); omissão de formulário → 0 |
| `destaque` | booleano; checkbox/switch; omissão → false |
| restantes | como na Fase 1 |

---

### `public.conteudo_site` — NOVA

| Coluna | Tipo | Restrições | Significado |
|--------|------|------------|-------------|
| `chave` | `text` | chave primária | identificador estável do bloco |
| `conteudo` | `jsonb` | `NOT NULL` | documento da secção |
| `atualizado_em` | `timestamptz` | `NOT NULL DEFAULT now()` | última gravação |

**Migração**: `supabase/migrations/0006_conteudo_site.sql` — cria tabela, RLS, seed.

**Chaves permitidas** (fechadas nesta feature):

| Chave | Uso na vitrine |
|-------|----------------|
| `hero` | `components/vitrine/Hero.tsx` |
| `marquee` | `components/vitrine/Maquee.tsx` |
| `quem_somos` | `components/vitrine/QuemSomos.tsx` |
| `onde_encontrar` | `components/vitrine/OndeNosEncontrar.tsx` |
| `rodape` | `components/vitrine/Rodape.tsx` |

Inserir chave fora deste conjunto MUST ser recusado na validação da aplicação. Não é
obrigatório CHECK SQL além da PK — o schema zod é a fonte de verdade da forma.

---

## Formas JSON por chave

### `hero`

```json
{
  "titulo": "string",
  "descricao": "string",
  "cta_texto": "string",
  "cta_ancora": "string",
  "imagem_src": "string"
}
```

| Campo | Validação |
|-------|-----------|
| `titulo` | string trim, 1..200 |
| `descricao` | string trim, 1..2000 |
| `cta_texto` | string trim, 1..80 |
| `cta_ancora` | string trim, 1..120 (ex.: `#catalogo`) |
| `imagem_src` | string trim, 1..500 (caminho `/images/...` ou URL http(s)) |

**Seed** (copy atual de `Hero.tsx`):

```json
{
  "titulo": "Chocolates artesanais que dão água na boca",
  "descricao": "Todos os produtos de Silvania'S cacau são desenvolvidos com cacau próprio, garantindo origem, qualidade e total rastreabilidade do cultivo à produção.",
  "cta_texto": "Ver catálogo",
  "cta_ancora": "#catalogo",
  "imagem_src": "/images/hero-v3.png"
}
```

### `marquee`

```json
{ "mensagem": "string" }
```

| Campo | Validação |
|-------|-----------|
| `mensagem` | string trim, 1..200 |

**Seed**: `{ "mensagem": "A arte de transformar paixão em sabor" }`

### `quem_somos`

```json
{
  "titulo": "string",
  "texto": "string",
  "imagem1_src": "string",
  "imagem2_src": "string"
}
```

| Campo | Validação |
|-------|-----------|
| `titulo` | string trim, 1..200 |
| `texto` | string trim, 1..5000 |
| `imagem1_src` | string trim, 1..500 |
| `imagem2_src` | string trim, 1..500 |

**Seed**:

```json
{
  "titulo": "Quem somos?",
  "texto": "Agroindústria de cacau, aqui na Amazônia o cacau encontra seu lar perfeito. Cultivamos o fruto que da vida aos nossos produtos. Silvania'S cacau nasce do encontro entre o cultivo com a arte de transformar! cada produto respeita o fruto, valoriza a biodiversidade e entrega chocolate de verdade, intenso, cremoso e cheio de história.",
  "imagem1_src": "/images/imagem-quem-somos-2-v2.png",
  "imagem2_src": "/images/imagem-quem-somos-1-v2.png"
}
```

### `onde_encontrar`

```json
{
  "titulo": "string",
  "endereco": "string",
  "mapa_embed_url": "string",
  "lat": "number",
  "lng": "number"
}
```

| Campo | Validação |
|-------|-----------|
| `titulo` | string trim, 1..200 |
| `endereco` | string trim, 1..1000 (pode conter quebras de linha) |
| `mapa_embed_url` | URL http(s) |
| `lat` | number finito |
| `lng` | number finito |

**Seed** (valores atuais de `OndeNosEncontrar.tsx`):

```json
{
  "titulo": "Onde nos encontrar?",
  "endereco": "R. Sete de Setembro, 1978 - Setor 4\nSanta Luzia D'Oeste - RO\nCEP 76950-000",
  "mapa_embed_url": "https://www.google.com/maps?q=-11.911265741721149,-61.78445093828045&z=17&output=embed",
  "lat": -11.911265741721149,
  "lng": -61.78445093828045
}
```

### `rodape`

```json
{
  "whatsapp_url": "string",
  "instagram_url": "string",
  "texto_contato": "string"
}
```

| Campo | Validação |
|-------|-----------|
| `whatsapp_url` | URL http(s) ou string vazia (vazio → fallback `NUMEROZAP`) |
| `instagram_url` | URL http(s) |
| `texto_contato` | string trim, 1..200 |

**Seed**:

```json
{
  "whatsapp_url": "https://wa.me/5569984750156",
  "instagram_url": "https://instagram.com/silvaniascacau",
  "texto_contato": "Fale conosco"
}
```

**Regra de resolução do WhatsApp no rodapé**:

1. Se `whatsapp_url` presente e não vazio após trim → usar.
2. Senão → `NUMEROZAP` de `lib/constants.ts`.
3. `gerarLinkWhatsapp` nos produtos **ignora** este documento.

---

## Segurança ao nível da linha — `conteudo_site`

| Comando | Papéis | Condição |
|---------|--------|----------|
| `SELECT` | `anon`, `authenticated` | `true` (leitura pública) |
| `INSERT` | `authenticated` | `public.is_admin()` |
| `UPDATE` | `authenticated` | `public.is_admin()` (USING + WITH CHECK) |
| `DELETE` | `authenticated` | `public.is_admin()` |

Nunca `FOR ALL TO authenticated`. Policies nomeadas por comando, espelhando
`produtos`.

**Camada de aplicação**: Server Action CMS chama `verificarAdmin` / `is_admin` **antes**
de `createAdminClient().from('conteudo_site').upsert(...)`. O bypass da service role
não dispensa o passo 2 do invariante (ver contrato de actions).

---

## Relações e ciclo de vida

```text
admins / is_admin() ──autoriza──► actions produtos + actions conteudo_site
                                         │
produtos (ordem, destaque) ──lê──► CatalogoSection (RSC)
conteudo_site ──lê──► Hero, Marquee, QuemSomos, OndeEncontrar, Rodape (RSC)
NUMEROZAP ──fallback──► Rodape (se whatsapp_url vazio)
NUMEROZAP ──sempre──► gerarLinkWhatsapp (PDP / cartões)
```

**Atualização de `atualizado_em`**: trigger `before update` que define `now()`, ou
valor explícito no upsert da action — preferir trigger para não esquecer.

---

## Tipos gerados

Após `0005` e `0006`, regenerar `types/database.ts` via `npm run db:types`. Componentes
e actions MUST importar tipos de lá para `produtos` e `conteudo_site`, sem redefinir à
mão (Princípio IV).
