# Gate de produção — segurança (urgente)

Estado verificado em 2026-08-06: `disable_signup` ainda é **`false`**.
Enquanto isto e as migrações antigas estiverem em produção, qualquer pessoa pode
criar conta e a policy antiga pode ainda permitir escrita.

## Passos (consola Supabase)

### 1. Fechar registo (≈30 s)

Authentication → Providers → **Allow new users to sign up** = OFF.

Confirmar:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | grep disable_signup
```

Esperado: `"disable_signup":true`

### 2. Aplicar SQL

SQL Editor → colar o conteúdo de
[`supabase/scripts/aplicar-fase1-producao.sql`](../supabase/scripts/aplicar-fase1-producao.sql)
→ Run.

Ou, com CLI autenticada: `npx supabase db push` (apontado ao projeto de produção).

### 3. Conta admin

Confirmar que `santos.hugh514@gmail.com` está em `public.admins`.
**Trocar a palavra-passe** na consola (Authentication → Users).

### 4. Smoke manual

Entrar em `/admin/login` → criar, editar e apagar um produto de teste.

## Critério de saída

Signup fechado + policies por comando + dona escreve + estranho negado.

O desenvolvimento do painel/CMS (branch de implementação) pode avançar em paralelo
no código; **não fazer merge para produção** até este gate estar verde.
