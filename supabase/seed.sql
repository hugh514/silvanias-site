-- Seed de DESENVOLVIMENTO LOCAL. Corre só em `supabase db reset` / `supabase start`
-- e nunca em produção (o `db push` não aplica seeds).
--
-- Admin local: admin@local.dev / admin123

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'admin@local.dev',
  crypt('admin123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@local.dev","email_verified":true}',
  'email', now(), now(), now()
);

insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.produtos (nome, categoria, descricao, ingredientes, disponivel, fotos) values
  ('Chocolate 70% Cacau', 'Chocolate',
   'Barra intensa feita com cacau da Amazônia, fermentado e torrado artesanalmente.',
   'Massa de cacau, açúcar demerara, manteiga de cacau.', true,
   array['/images/categoria-chocolate-v3.png']),
  ('Chocolate ao Leite 45%', 'Chocolate',
   'Cremoso e equilibrado, para quem prefere um chocolate mais suave.',
   'Massa de cacau, açúcar, leite em pó integral, manteiga de cacau.', true,
   array['/images/categoria-chocolate-v3.png']),
  ('Nibs de Cacau', 'Derivados do Cacau',
   'Pedaços de amêndoa de cacau torrada, crocantes e sem açúcar.',
   'Amêndoas de cacau torradas.', true,
   array['/images/categoria-derivados-v2.png']),
  ('Manteiga de Cacau', 'Derivados do Cacau',
   'Manteiga de cacau pura, para culinária e cosmética.',
   'Manteiga de cacau.', true,
   array['/images/categoria-derivados-v2.png']),
  ('Chocolate com Cupuaçu', 'Chocolate',
   'Edição sazonal, ainda indisponível — só aparece no painel.',
   'Massa de cacau, açúcar, cupuaçu desidratado.', false,
   array['/images/categoria-chocolate-v3.png']);
