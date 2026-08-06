-- =============================================================================
-- 0001 — Lista de administradores e função de autorização
--
-- Contexto: auditoria de 2026-07-25 confirmou que qualquer conta autenticada
-- tinha poder de escrita sobre o catálogo. A política era FOR ALL TO authenticated.
-- Esta migração cria a lista de inclusão explícita que substitui essa suposição.
--
-- Retrocompatível com o código atual: as escritas do painel partem do navegador
-- com o token da dona. Assim que ela constar de public.admins, is_admin() devolve
-- verdadeiro e as políticas de 0002 aceitam exatamente as mesmas escritas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela de administradores
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

comment on table public.admins is
  'Lista de inclusão explícita de contas com poder de administração. '
  'Pertencer a esta tabela é a ÚNICA forma de obter esse poder — nenhum atributo '
  'da conta de autenticação o confere por si.';

-- Segurança ao nível da linha LIGADA e SEM políticas.
-- A ausência de políticas é o mecanismo, não um esquecimento: sem elas, nenhum
-- papel de aplicação lê ou escreve nesta tabela pela interface de dados. Só a
-- credencial de serviço (que faz desvio) e funções security definer lhe tocam.
-- Consequência: a lista não é enumerável do exterior, nem por um administrador.
alter table public.admins enable row level security;

-- -----------------------------------------------------------------------------
-- Função de autorização
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- (select auth.uid()) em vez de auth.uid() direto: permite ao planeador avaliar
  -- uma vez por instrução em vez de uma vez por linha. Diferença mensurável em
  -- consultas de listagem.
  select exists (
    select 1
      from public.admins a
     where a.user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is
  'Verdadeiro se a conta do pedido atual consta de public.admins. '
  'security definer para conseguir ler a tabela apesar do RLS. '
  'search_path vazio é CRÍTICO: sem ele, quem controlar o caminho de procura pode '
  'fazer sombra a public.admins com uma tabela própria e obter administração.';

revoke all on function public.is_admin() from public;

-- CONCEDER TAMBÉM A `anon` — não é descuido, é obrigatório.
--
-- A política de leitura de 0002 é `disponivel is true or public.is_admin()`, e é
-- avaliada com os privilégios de quem consulta. Sem execução concedida a `anon`,
-- a avaliação rebenta e o visitante anónimo deixa de ver o catálogo INTEIRO —
-- não apenas os produtos indisponíveis.
--
-- A primeira versão concedia só a `authenticated`, com o raciocínio de que um
-- anónimo nunca pode ser administrador. O raciocínio está certo; a conclusão
-- estava errada. A função tem de poder correr para devolver falso.
--
-- Apanhado a 2026-07-25 pelo teste `disponiveis_continuam_visiveis_a_anonimo`.
-- Teria fechado a vitrine ao público em produção.
--
-- Conceder é inofensivo: para um anónimo `auth.uid()` é nulo, logo o resultado é
-- sempre falso. E a tabela `admins` continua ilegível — a função é security
-- definer e devolve apenas um booleano.
grant execute on function public.is_admin() to anon, authenticated;

-- `service_role` precisa de tocar na tabela para gerir a lista. As políticas não
-- se lhe aplicam (faz desvio), mas o privilégio ao nível da tabela sim: sem
-- isto, semear ou remover administradores falha com «permission denied».
grant all on table public.admins to service_role;

-- -----------------------------------------------------------------------------
-- Semeadura: DELIBERADAMENTE FORA DESTA MIGRAÇÃO
--
-- Quem administra é uma decisão operacional, não estrutural. Gravá-la aqui teria
-- dois problemas: punha um endereço de correio pessoal no repositório, e obrigava
-- a uma migração nova sempre que a lista mudasse.
--
-- Uma versão anterior semeava automaticamente a partir da conta única existente.
-- Foi retirado ao descobrir-se que a conta existente não é a que deve administrar
-- — teria dado o controlo do catálogo a quem não devia, em silêncio.
--
-- A lista fica VAZIA depois desta migração. Isso é intencional, mas significa que
-- aplicar 0002 sem semear primeiro bloqueia toda a gente. A ordem correta é:
--
--   1. aplicar 0001            (esta migração)
--   2. semear public.admins    (comando abaixo, com a conta certa)
--   3. aplicar 0002 e 0003     (políticas)
--
-- Semear:
--   insert into public.admins (user_id)
--   select id from auth.users where email = '<endereco>'
--   on conflict (user_id) do nothing;
--
-- Procedimento completo, incluindo recuperação de acesso, no README.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.admins) then
    raise notice
      'public.admins está vazia. Semear antes de aplicar 0002, '
      'ou o painel fica inacessível a toda a gente.';
  end if;
end $$;
