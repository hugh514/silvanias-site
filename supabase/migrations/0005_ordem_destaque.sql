-- 0005 — Ordem e destaque dos produtos no catálogo público.
--
-- As colunas herdam as políticas de 0002: leitura pública só do que está
-- disponível, escrita só para `is_admin()`. Ordenação pública canónica:
--   order by ordem asc, created_at desc

alter table public.produtos
  add column if not exists ordem    integer not null default 0,
  add column if not exists destaque boolean not null default false;

create index if not exists produtos_ordem_idx on public.produtos (ordem, created_at desc);
