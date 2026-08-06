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
