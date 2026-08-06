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
