-- Silvania Fase 1 — aplicar em PRODUÇÃO via SQL Editor (begin/commit).
-- Gerado a partir de supabase/migrations/0000..0004. Revisar antes de colar.
-- NOTA: 0000 usa IF NOT EXISTS; em prod a tabela já existe — grants/policies das 0001+ são o essencial.
begin;

-- ========== 0000_baseline_produtos.sql ==========
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

-- ========== 0001_admins_e_is_admin.sql ==========
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

-- ========== 0002_politicas_produtos.sql ==========
-- =============================================================================
-- 0002 — Políticas de acesso a public.produtos, uma por comando
--
-- Substitui a política FOR ALL TO authenticated confirmada pela auditoria de
-- 2026-07-25, que deixava qualquer conta autenticada criar, alterar e remover
-- produtos. Provado na altura: um INSERT com conta acabada de criar devolveu
-- 23502 (campo obrigatório em falta) — ou seja, o RLS deixou passar e só a
-- restrição NOT NULL travou.
--
-- Depende de 0001 (public.is_admin).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Limpar o que existe
--
-- Remove TODAS as políticas atuais em vez de as nomear: a auditoria não
-- conseguiu enumerá-las pela interface de dados, e deixar uma permissiva para
-- trás anularia todo o resto.
-- -----------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename  = 'produtos'
  loop
    execute format('drop policy %I on public.produtos', p.policyname);
    raise notice 'Política removida: %', p.policyname;
  end loop;
end $$;

alter table public.produtos enable row level security;

-- -----------------------------------------------------------------------------
-- Leitura
--
-- Pública, mas só do que está disponível. Um administrador vê tudo, porque o
-- painel precisa de gerir os indisponíveis.
--
-- Nota sobre `disponivel is true` em vez de `disponivel <> false`: a coluna
-- aceita nulo. Com esta formulação, um produto sem disponibilidade definida fica
-- INVISÍVEL ao público — seguro por omissão. Um produto só aparece se alguém
-- disse explicitamente que está disponível.
-- -----------------------------------------------------------------------------
create policy "produtos_select_publico"
  on public.produtos
  for select
  to anon, authenticated
  using (disponivel is true or public.is_admin());

-- -----------------------------------------------------------------------------
-- Escrita — exclusiva de quem consta da lista
-- -----------------------------------------------------------------------------
create policy "produtos_insert_admin"
  on public.produtos
  for insert
  to authenticated
  with check (public.is_admin());

-- `using` E `with check`: sem a segunda, um administrador poderia alterar uma
-- linha para um estado que a política já não permitiria. Aqui a condição não
-- depende de colunas da linha, mas omiti-la seria um mau hábito a repetir quando
-- o esquema crescer.
create policy "produtos_update_admin"
  on public.produtos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "produtos_delete_admin"
  on public.produtos
  for delete
  to authenticated
  using (public.is_admin());

-- ========== 0003_limites_e_politicas_storage.sql ==========
-- =============================================================================
-- 0003 — Limites e políticas do contentor `produtos`
--
-- Estado confirmado pela auditoria de 2026-07-25:
--   file_size_limit    = NULL  (qualquer tamanho)
--   allowed_mime_types = NULL  (qualquer ficheiro)
-- Um envio com conta acabada de criar devolveu HTTP 200 e criou um ficheiro real.
-- Na prática, alojamento aberto a servir do domínio da marca.
--
-- Depende de 0001 (public.is_admin).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Limites do contentor — segunda camada, independente das políticas.
-- Cobre quem chame o armazenamento diretamente, sem passar pela aplicação.
-- -----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit    = 5242880,  -- 5 MB, alinhado com o limite já praticado no formulário
       allowed_mime_types = array[
         'image/jpeg',
         'image/png',
         'image/webp',
         'image/avif'
       ]
 where id = 'produtos';

-- SVG deliberadamente excluído: é um documento que pode conter script e, servido
-- de um contentor público, torna-se vetor de execução de código com a origem da
-- marca. GIF excluído por não ser formato de foto de produto.

-- -----------------------------------------------------------------------------
-- Limpar políticas existentes deste contentor
-- -----------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname
      from pg_policies
     where schemaname = 'storage'
       and tablename  = 'objects'
       and (coalesce(qual, '') like '%produtos%'
         or coalesce(with_check, '') like '%produtos%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
    raise notice 'Política de storage removida: %', p.policyname;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Leitura pública — intencional. É uma vitrine; as fotos têm de carregar sem sessão.
-- -----------------------------------------------------------------------------
create policy "produtos_storage_select_publico"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'produtos');

-- -----------------------------------------------------------------------------
-- Escrita — exclusiva de quem consta da lista de administradores
-- -----------------------------------------------------------------------------
create policy "produtos_storage_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos_storage_update_admin"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin())
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos_storage_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

-- ========== 0004_tentativas_login.sql ==========
-- =============================================================================
-- 0004 — Contagem de tentativas de entrada falhadas
--
-- FR-020: travar 5 falhas consecutivas por origem durante 15 minutos.
--
-- Decisão D2: tabela no Postgres já existente em vez de um serviço externo de
-- contagem. Há uma administradora e o volume legítimo é de unidades por semana;
-- acrescentar um fornecedor, uma conta e mais um segredo para proteger o acesso
-- de uma pessoa seria desproporcionado. A base de dados já é dependência crítica
-- do login, portanto não se introduz um novo ponto de falha.
-- =============================================================================

create table if not exists public.tentativas_login (
  id          bigint generated always as identity primary key,
  origem      text        not null,
  ocorrido_em timestamptz not null default now()
);

create index if not exists tentativas_login_origem_ocorrido_em_idx
  on public.tentativas_login (origem, ocorrido_em desc);

comment on table public.tentativas_login is
  'Tentativas de entrada falhadas, por origem. Existe apenas o tempo necessário '
  'para decidir se bloqueia. Entradas com mais de 24 h são removidas.';

-- RLS ligada e SEM políticas, pelo mesmo motivo de public.admins: quem está a
-- tentar entrar não deve conseguir ler quantas tentativas já fez, nem apagar o
-- seu próprio rasto. Só funções security definer lhe tocam.
alter table public.tentativas_login enable row level security;

-- -----------------------------------------------------------------------------
-- Parâmetros
-- -----------------------------------------------------------------------------
-- 5 tentativas / 15 minutos. Padrão corrente para painéis de administração de
-- baixo volume. Com uma única administradora, o risco de bloquear alguém
-- legítimo é desprezável.

create or replace function public.registar_tentativa_falhada(p_origem text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tentativas_login (origem) values (p_origem);

  -- Limpeza oportunista: evita depender de um agendador para a tabela não
  -- crescer sem limite. Proporcional ao volume deste projeto.
  delete from public.tentativas_login
   where ocorrido_em < now() - interval '24 hours';
end;
$$;

create or replace function public.entrada_bloqueada(p_origem text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) >= 5
    from public.tentativas_login t
   where t.origem = p_origem
     and t.ocorrido_em > now() - interval '15 minutes';
$$;

create or replace function public.limpar_tentativas(p_origem text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.tentativas_login t where t.origem = p_origem;
$$;

-- Só o servidor da aplicação chama estas funções, através da credencial de
-- serviço. Nenhum papel de aplicação precisa de execução direta.
revoke all on function public.registar_tentativa_falhada(text) from public;
revoke all on function public.entrada_bloqueada(text)          from public;
revoke all on function public.limpar_tentativas(text)          from public;

-- `revoke ... from public` remove a concessão implícita a TODOS os papéis,
-- incluindo service_role. Sem os grants abaixo as funções devolvem null em vez
-- de executar, e a limitação de tentativas deixa silenciosamente de funcionar —
-- falha aberta, a pior espécie.
-- Descoberto a 2026-07-25 pelos testes de integração, que devolveram null onde
-- esperavam um booleano.
grant execute on function public.registar_tentativa_falhada(text) to service_role;
grant execute on function public.entrada_bloqueada(text)          to service_role;
grant execute on function public.limpar_tentativas(text)          to service_role;

commit;
