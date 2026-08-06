# Arranque Rápido — Validação

**Feature**: Painel, Conteúdo do Site e SEO
**Data**: 2026-08-06

Como confirmar que a feature funciona. Sequência espelha [plan.md](./plan.md) e
[tasks.md](./tasks.md).

---

## Pré-requisitos

| Requisito | Notas |
|-----------|-------|
| Feature `001` aplicada no ambiente de teste | RLS produtos, `admins`, actions |
| Node 24+, deps instaladas | `npm ci` |
| Ambiente Supabase de **teste** (nunca produção) | guarda `tests/setup/guarda-ambiente.ts` |
| Variáveis em `.env` | ver abaixo |

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Credenciais E2E admin (já usadas na 001): `E2E_EMAIL`, `E2E_PASSWORD` conforme
`playwright.config` / specs existentes.

---

## 1 — Migrações

```bash
# no ambiente de teste
supabase db reset   # ou aplicar 0005 e 0006 em cima do estado 001
npm run db:types
```

Verificar:

```sql
-- colunas novas
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema='public' and table_name='produtos'
   and column_name in ('ordem','destaque');

-- cinco seeds
select chave from public.conteudo_site order by chave;
-- esperado: hero, marquee, onde_encontrar, quem_somos, rodape

-- policies por comando
select policyname, cmd from pg_policies
 where schemaname='public' and tablename='conteudo_site' order by cmd;
```

---

## 2 — Testes automatizados

```bash
npm test                 # unit — schemas produto + conteudo-site
npm run test:integration # deny não-admin + RLS conteudo_site + regressão 001
npm run test:e2e         # painel, CMS→vitrine, seo smoke
```

**Esperado**: suites `001` verdes; novos casos de negação CMS vermelhos antes da
implementação das policies/actions e verdes depois.

---

## 3 — Validação manual do painel

1. `npm run dev`
2. Entrar em `/admin/login` como a dona.
3. Confirmar sidebar: **Produtos | Conteúdo do site | Sair**.
4. Em Produtos: tabela com pesquisa; editar um produto — alterar `ordem` e `destaque`;
   gravar; ver **toast** de sucesso (sem `alert`).
5. Abrir `/` em janela anónima: ordem do catálogo respeitada; destaque visível.
6. Em Conteúdo do site: alterar título do hero; gravar; toast; recarregar `/` anónimo
   e ver o novo título.
7. Esvaziar `whatsapp_url` do rodapé (ou gravar vazio se o form permitir): rodapé cai
   em `NUMEROZAP`. Link WhatsApp dum produto continua `gerarLinkWhatsapp`.

---

## 4 — SEO smoke

```bash
curl -sI http://localhost:3000/sitemap.xml | head -1   # 200
curl -sI http://localhost:3000/robots.txt | head -1    # 200
curl -s http://localhost:3000/robots.txt               # referencia sitemap
```

Ver código-fonte de `/` e `/produtos/[id]`: `og:` / twitter meta com URLs absolutas
baseadas em `NEXT_PUBLIC_SITE_URL`.

---

## 5 — Segurança rápida

Com utilizador descartável **fora** de `admins` (helper da 001):

- UPDATE em `produtos` (ordem/destaque) → negado
- UPSERT em `conteudo_site` → negado
- SELECT em `conteudo_site` → permitido

---

## Recuperação

| Problema | Ação |
|----------|------|
| Vitrine sem texto após migração | Confirmar seed `select * from conteudo_site`; reaplicar `0006` no ambiente de teste |
| Rodapé sem WhatsApp | Verificar fallback `NUMEROZAP`; não remover a constante |
| Tipos TS desatualizados | `npm run db:types` |
| Login admin com sidebar indevida | Ajustar exclusão do segmento login no layout |

---

## Fora deste quickstart

Não validar: motion/GSAP/Three, Meta Catalog, mudança de password, CSP enforce,
redesign visual.
