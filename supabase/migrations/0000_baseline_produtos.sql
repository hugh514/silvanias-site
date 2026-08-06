-- =============================================================================
-- 0000 — Definição base da tabela `produtos`
--
-- PORQUE É QUE ESTA MIGRAÇÃO EXISTE
-- A tabela nunca esteve sob controlo de versões: foi criada à mão pela consola
-- do Supabase. Produção tinha-a, o repositório não — o que só se tornou visível
-- ao levantar o primeiro ambiente limpo, a 2026-07-25, quando 0002 rebentou com
-- «relation "public.produtos" does not exist».
--
-- Consequências práticas disso, que esta migração resolve:
--   - nenhum ambiente novo podia ser construído a partir do repositório
--   - não havia forma de correr os testes de integração sem tocar em produção
--   - o esquema real não estava documentado em lado nenhum verificável
--
-- A forma abaixo corresponde ao esquema lido do próprio projeto de produção a
-- 2026-07-25, pela especificação OpenAPI exposta pelo PostgREST.
--
-- `if not exists` em tudo: em produção esta migração não faz nada, porque a
-- tabela já lá está. Só tem efeito em ambientes novos.
-- =============================================================================

create table if not exists public.produtos (
  id           uuid        primary key default gen_random_uuid(),
  nome         text        not null,
  categoria    text        not null,
  descricao    text,
  ingredientes text,
  -- Aceita nulo, tal como em produção. A política de leitura de 0002 usa
  -- `disponivel is true`, pelo que um produto sem disponibilidade definida fica
  -- invisível ao público — seguro por omissão.
  disponivel   boolean     default true,
  fotos        text[],
  created_at   timestamptz default now()
);

comment on table public.produtos is
  'Catálogo de produtos. Esquema recuperado para controlo de versões a 2026-07-25; '
  'até essa data existia apenas em produção, criado manualmente.';

-- Usado pela listagem do painel e pela vitrine, ambas ordenadas por data.
create index if not exists produtos_created_at_idx
  on public.produtos (created_at desc);

-- -----------------------------------------------------------------------------
-- Privilégios ao nível da tabela
--
-- Segunda coisa que nunca esteve versionada. Em produção a tabela foi criada
-- pela consola, que concede estes privilégios automaticamente; criada por
-- migração numa base limpa, não recebe nenhum — e tudo falha com
-- «permission denied for table produtos», mesmo com as políticas corretas.
-- Descoberto a 2026-07-25 ao correr os testes de integração pela primeira vez.
--
-- Isto é a camada de PRIVILÉGIO, distinta da camada de POLÍTICA. As duas são
-- necessárias: o privilégio diz se o papel pode tocar na tabela, a política diz
-- em que linhas. Conceder aqui não afrouxa nada — 0002 continua a decidir quem
-- escreve o quê.
-- -----------------------------------------------------------------------------
grant select                         on public.produtos to anon, authenticated;
grant insert, update, delete         on public.produtos to authenticated;
grant all                            on public.produtos to service_role;

-- -----------------------------------------------------------------------------
-- Contentor de armazenamento das fotos
--
-- Também criado à mão em produção. Aqui fica registado para que um ambiente novo
-- tenha onde guardar as imagens. Os limites de tipo e tamanho são aplicados em
-- 0003 — esta migração apenas garante que o contentor existe.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;
