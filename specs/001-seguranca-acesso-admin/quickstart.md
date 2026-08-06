# Arranque Rápido — Validação

**Feature**: Segurança de Acesso ao Painel Administrativo
**Data**: 2026-07-25

Como confirmar que a feature funciona. Sequência espelha a ordem de execução do
[plano](./plan.md).

---

## Pré-requisitos

| Requisito | Estado nesta máquina |
|-----------|----------------------|
| Node 24+ | ✅ 24.13.0 |
| Ferramenta de linha de comandos do Supabase | ❌ instalar |
| Serviço de contentores | ⚠️ Docker instalado mas inacessível; Podman disponível |
| Acesso à consola do projeto Supabase | necessário para o passo A0 |

**Variáveis de ambiente** em `.env` — já existem, não commitadas (confirmado: `.env` nunca
entrou no histórico de git):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

---

## Etapa A — Confirmar que a brecha fechou

### A0 — Fechar o registo público *(manual, não há forma por código)*

Consola do Supabase → **Authentication** → **Sign In / Providers** → desligar
**Allow new users to sign up**.

Confirmar:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | grep disable_signup
```

**Esperado**: `"disable_signup": true`. Antes desta feature era `false`.

### A1 — Aplicar as migrações

Antes de aplicar, confirmar o estado de partida:

```sql
select policyname, roles, cmd from pg_policies
 where schemaname='public' and tablename='produtos';
```

Guardar o resultado. É o que se está a substituir.

Aplicar `0001` a `0003`. Confirmar:

```sql
-- quatro políticas, uma por comando, nenhuma FOR ALL
select policyname, cmd from pg_policies
 where schemaname='public' and tablename='produtos' order by cmd;

-- a dona está na lista
select count(*) from public.admins;   -- esperado: 1

-- limites do contentor
select file_size_limit, allowed_mime_types
  from storage.buckets where id='produtos';
-- esperado: 5242880 e os quatro tipos de imagem
```

### A2 — Reexecutar as sondas da auditoria

O teste que interessa. Cria um utilizador descartável, tenta a cadeia toda, e apaga-o.

**Antes desta feature** o resultado era: criação de produto travada apenas pela restrição
de campo obrigatório (`23502`), alteração e remoção aceites (`204`), envio de ficheiro
aceite (`200`, ficheiro real criado).

**Depois** todos os passos de escrita devem devolver recusa por política de acesso
(`42501`) ou proibido (`403`).

O guião usado na auditoria está em
`scratchpad/probe_authed.py` da sessão de 2026-07-25 e deve ser formalizado como
`tests/integration/acesso-negado.test.ts` no passo B9.

**Critério de passagem**: nenhum dos seis passos da cadeia se reproduz.

### Verificação de não regressão — obrigatória em conjunto com A1

A História 5 tem a mesma prioridade que a História 1. Confirmar **na mesma sessão**:

| Verificação | Esperado |
|-------------|----------|
| Abrir `/` sem sessão | catálogo carrega com as fotos |
| Abrir a página de um produto disponível | carrega por completo |
| Abrir a página de um produto indisponível | não encontrado |
| Entrar no painel como a dona | entra; vê disponíveis e indisponíveis |
| Criar, editar e apagar um produto de teste pelo painel | funciona, **ainda sem alterações de código** |

A última linha é a prova de que a migração é retrocompatível (decisão D1). Se falhar, o
pressuposto central do plano está errado e a sequência tem de ser repensada antes de
continuar.

---

## Etapa B — Confirmar que não reabre

### Fronteira de segredos

```bash
npm run build
```

Depois, tentar deliberadamente violá-la: acrescentar
`import { createAdminClient } from '@/lib/supabase/admin'` a um ficheiro com `"use client"`
e construir de novo.

**Esperado**: a construção **falha** com erro do `server-only`. Se passar, FR-028 não está
satisfeito. Reverter a alteração deliberada depois do teste.

### Autorização no proxy

| Cenário | Esperado |
|---------|----------|
| Sem sessão, abrir `/admin/produtos` | reencaminha para a entrada |
| Sessão de conta ausente de `admins`, abrir `/admin/produtos` | **reencaminha para a entrada** |
| Sessão da dona | entra |
| Sem sessão, abrir `/` | carrega, e o middleware **não corre** |

A última linha é verificável nos registos de execução: o alcance passou a `/admin`, pelo
que a vitrine deixa de pagar uma chamada de rede por visita.

### Envio de ficheiros

| Ficheiro | Esperado |
|----------|----------|
| JPEG válido, 1 MB | aceite |
| PDF renomeado para `.jpg` | **recusado** — a assinatura de conteúdo não corresponde |
| SVG | **recusado** — tipo não permitido |
| JPEG de 8 MB | **recusado** — acima do limite |
| Nome `../../evil.jpg` | aceite, guardado com nome gerado, na pasta prevista |

O segundo e o último são os que provam que a validação não é decorativa.

### Limitação de tentativas

Falhar a entrada cinco vezes seguidas. A sexta é travada. Aguardar, ou limpar a tabela,
e confirmar que volta a aceitar. Confirmar também que uma entrada correta antes da quinta
repõe a contagem.

Comparar a mensagem de erro entre um endereço existente e um inexistente: têm de ser
idênticas (FR-021).

### Cabeçalhos

```bash
curl -sI https://<dominio> | grep -iE 'content-security|strict-transport|x-frame|x-content-type|referrer|permissions'
```

Na primeira publicação a política de origens vai em modo de observação. Confirmar que o
mapa, os ícones, as fotos e a recolha de estatísticas continuam a funcionar, e recolher as
violações reportadas durante o período de observação antes de passar a bloqueio (C1).

---

## Testes

```bash
npm run test          # unitário e integração
npm run test:e2e      # percurso completo
```

**Regra absoluta**: a configuração de teste recusa-se a arrancar se detetar o identificador
do projeto de produção. Verificar essa salvaguarda antes de correr qualquer coisa.

---

## Recuperação de acesso

Se a lista de administradores ficar vazia, ou a dona perder o acesso, o painel fica
inacessível a toda a gente — as políticas não têm exceção.

**A recuperação faz-se pela consola do Supabase**, no editor de SQL, que corre com a
credencial de serviço e faz desvio às políticas:

```sql
insert into public.admins (user_id)
select id from auth.users where email = '<endereco>'
on conflict (user_id) do nothing;
```

**Nunca** recuperar afrouxando uma política. Repor `FOR ALL TO authenticated` seria repor
exatamente a vulnerabilidade que esta feature fecha. Por isso as migrações não incluem
reversão para o estado anterior.

---

## Ordem de publicação

| # | O quê | Reversível | Deixa o site em baixo |
|---|-------|-----------|----------------------|
| 1 | A0, fechar registo | sim, imediato | não |
| 2 | A1, migrações | sim, mas ver a nota de recuperação | não |
| 3 | B1-B7, alterações de código | sim, por reversão do commit | não, se testado |
| 4 | B8, cabeçalhos em observação | sim | não |
| 5 | C1, cabeçalhos em bloqueio | sim | **possivelmente**, se mal calibrado — daí o período de observação |

O passo 1 sozinho já corta a cadeia de ataque e não depende de nada. É o que deve acontecer
primeiro, hoje, independentemente do estado do resto do plano.
