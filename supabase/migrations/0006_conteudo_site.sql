-- 0006 — Conteúdo editável da vitrine.
--
-- Uma linha por secção. A forma de cada `conteudo` é validada na aplicação
-- (lib/schemas/conteudo-site.ts); aqui só se garante QUEM pode escrever.
-- Só existem as 5 chaves semeadas abaixo: não há política de INSERT nem DELETE,
-- portanto nem um admin cria ou apaga secções — só as altera.

create table if not exists public.conteudo_site (
  chave         text        primary key,
  conteudo      jsonb       not null,
  atualizado_em timestamptz not null default now()
);

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists conteudo_site_atualizado_em on public.conteudo_site;
create trigger conteudo_site_atualizado_em
  before update on public.conteudo_site
  for each row execute function public.tocar_atualizado_em();

-- Concessões mínimas: ler (todos) e alterar (autenticados, filtrado pelo RLS).
-- Sem insert/delete para ninguém além do service_role.
grant select on public.conteudo_site to anon, authenticated;
grant update on public.conteudo_site to authenticated;
grant all    on public.conteudo_site to service_role;

alter table public.conteudo_site enable row level security;

create policy "conteudo_site_select_publico"
  on public.conteudo_site
  for select
  to anon, authenticated
  using (true);

create policy "conteudo_site_update_admin"
  on public.conteudo_site
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Textos atuais da vitrine. `on conflict do nothing`: reaplicar não apaga edições.
insert into public.conteudo_site (chave, conteudo) values
  ('hero', jsonb_build_object(
    'titulo', 'Chocolates artesanais que dão água na boca',
    'descricao', 'Todos os produtos da Silvania''s Cacau são feitos com cacau próprio, garantindo origem, qualidade e rastreabilidade do cultivo à produção.')),
  ('marquee', jsonb_build_object('mensagem', 'A arte de transformar paixão em sabor')),
  ('quem_somos', jsonb_build_object(
    'titulo', 'Aqui na Amazônia o cacau encontra seu lar',
    'texto', 'Somos uma agroindústria de cacau. Cultivamos o fruto que dá vida aos nossos produtos, e a Silvania''s Cacau nasce desse encontro entre o cultivo e a arte de transformar.')),
  ('onde_encontrar', jsonb_build_object(
    'endereco', E'R. Sete de Setembro, 1978 - Setor 4\nSanta Luzia D''Oeste - RO\nCEP 76950-000',
    'lat', -11.911265741721149,
    'lng', -61.78445093828045)),
  ('rodape', jsonb_build_object(
    'frase', 'A arte de transformar paixão em sabor.',
    'instagram_url', 'https://instagram.com/silvaniascacau'))
on conflict (chave) do nothing;
