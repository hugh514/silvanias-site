# Contrato — `conteudo_site` (API de dados e formas)

**Feature**: Painel, Conteúdo do Site e SEO
**Data**: 2026-08-06

Contrato da tabela `public.conteudo_site` e das formas JSON por chave. Detalhe de
validação e seed em [data-model.md](../data-model.md).

---

## Recurso

| Aspeto | Valor |
|--------|-------|
| Tabela | `public.conteudo_site` |
| PK | `chave text` |
| Documento | `conteudo jsonb NOT NULL` |
| Carimbo | `atualizado_em timestamptz NOT NULL` |

---

## Chaves estáveis

```text
hero | marquee | quem_somos | onde_encontrar | rodape
```

Qualquer outra chave é inválida na fronteira da aplicação.

---

## Schemas (resumo TypeScript-like)

```ts
type Hero = {
  titulo: string
  descricao: string
  cta_texto: string
  cta_ancora: string
  imagem_src: string
}

type Marquee = { mensagem: string }

type QuemSomos = {
  titulo: string
  texto: string
  imagem1_src: string
  imagem2_src: string
}

type OndeEncontrar = {
  titulo: string
  endereco: string
  mapa_embed_url: string
  lat: number
  lng: number
}

type Rodape = {
  whatsapp_url: string
  instagram_url: string
  texto_contato: string
}

type ConteudoPorChave = {
  hero: Hero
  marquee: Marquee
  quem_somos: QuemSomos
  onde_encontrar: OndeEncontrar
  rodape: Rodape
}
```

Implementação: `lib/schemas/conteudo-site.ts` com `z.discriminatedUnion` ou mapa
`chave → schema`.

---

## Operações

### Leitura pública

```
GET-equivalent: select chave, conteudo, atualizado_em from conteudo_site [where chave = $1]
```

- Papéis: `anon`, `authenticated`
- Uso: RSC da vitrine e formulário admin (pré-preenchimento)
- Fallback: se em falta, componentes usam seed documentado / `NUMEROZAP`

### Escrita (só admin via Server Action)

```
upsert conteudo_site (chave, conteudo) on conflict (chave)
```

- Nunca a partir de `"use client"` com cliente browser
- Sempre após `is_admin()` + zod + `createAdminClient`

### Remoção

Fora de âmbito do painel. As cinco linhas do seed são permanentes. DELETE via SQL só
em manutenção, ainda sujeito a RLS `is_admin()`.

---

## Matriz RLS

| Comando | anon | authenticated (não-admin) | authenticated (admin) |
|---------|------|---------------------------|------------------------|
| SELECT | ✅ | ✅ | ✅ |
| INSERT | ❌ | ❌ | ✅ (`is_admin()`) |
| UPDATE | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ✅ |

Policies **por comando**, nomes sugeridos:

- `conteudo_site_select_publico`
- `conteudo_site_insert_admin`
- `conteudo_site_update_admin`
- `conteudo_site_delete_admin`

---

## Consumidores

| Chave | Componente | Notas |
|-------|------------|-------|
| `hero` | `Hero.tsx` | RSC; `imagem_src` no `next/image` |
| `marquee` | `Maquee.tsx` | mensagem repetida; animação CSS existente intacta |
| `quem_somos` | `QuemSomos.tsx` | duas imagens |
| `onde_encontrar` | `OndeNosEncontrar.tsx` | client para iframe; dados via props do pai RSC |
| `rodape` | `Rodape.tsx` | `whatsapp_url` com fallback `NUMEROZAP` |

---

## Compatibilidade com WhatsApp de produto

```text
Rodape.hrefWhatsapp = rodape.whatsapp_url?.trim() || NUMEROZAP
Produto.waLink      = gerarLinkWhatsapp(mensagem)  // sempre NUMEROZAP base
```

Não há campo CMS que altere `gerarLinkWhatsapp` nesta feature.
