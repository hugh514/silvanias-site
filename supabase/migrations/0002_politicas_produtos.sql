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
