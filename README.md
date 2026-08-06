# Silvania's Cacau

Vitrine virtual para a Silvania's Cacau, uma agroindústria artesanal de
chocolate localizada na Amazônia. O projeto substitui a divulgação feita
por Instagram, apresentando os produtos da empresa de forma organizada e
profissional para outras empresas interessadas.

## Sobre o projeto

O site funciona como um catálogo digital, onde é possível conhecer a
empresa, navegar pelos produtos disponíveis e entrar em contato
diretamente pelo WhatsApp para combinar valores e condições. Além da
vitrine pública, o projeto conta com um painel administrativo simples,
que permite à própria empresa cadastrar, editar e gerenciar seus produtos
sem depender de suporte técnico.

## Funcionalidades

- Vitrine pública com apresentação da empresa, catálogo de produtos e
  página de detalhes de cada produto
- Seção "Quem somos", contando a história e os valores da empresa
- Seção de localização com mapa interativo
- Contato direto via WhatsApp, Instagram e Facebook
- Painel administrativo com login protegido
- Cadastro, edição e exclusão de produtos, incluindo upload de fotos
- Controle de disponibilidade dos produtos

## Tecnologias utilizadas

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** para estilização
- **Supabase** (banco de dados, autenticação e armazenamento de imagens)
- **Vercel** para hospedagem

## Objetivo

Oferecer uma presença digital simples, rápida e fácil de manter para a
Silvania's Cacau, valorizando a apresentação dos produtos e facilitando o
primeiro contato com potenciais parceiros comerciais.

## Link do site
*https://silvanias-site.vercel.app/*

---

## Administração

### Quem pode gerenciar o catálogo

O acesso ao painel é uma **lista explícita**: só quem estiver na tabela
`public.admins` consegue criar, editar ou excluir produtos, e só essas contas
enxergam produtos marcados como indisponíveis. Estar autenticado não basta.

O cadastro público de contas está **desligado** de propósito. O site não tem
contas de cliente — quem visita nunca faz login, e a venda é fechada pelo
WhatsApp. A única coisa que uma conta faz aqui é abrir o painel; deixar o
cadastro aberto equivalia a permitir que qualquer pessoa criasse para si um
login de administrador.

### Dar acesso a alguém

1. No painel do Supabase: **Authentication → Users → Add user**, marcando
   "Auto Confirm User".
2. No **SQL Editor**, adicionar essa conta à lista:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'endereco@exemplo.com'
on conflict (user_id) do nothing;
```

### Remover acesso

```sql
delete from public.admins
 where user_id = (select id from auth.users where email = 'endereco@exemplo.com');
```

A remoção tem efeito na requisição seguinte — não é preciso encerrar a sessão da
pessoa nem esperar o token expirar.

### Recuperar o acesso

Se a lista ficar vazia, o painel fica inacessível para todo mundo: as políticas
não têm exceção. A recuperação é feita pelo **SQL Editor** do Supabase, que roda
com a credencial de serviço e ignora as políticas — basta o `insert` acima.

**Nunca recupere o acesso afrouxando uma política.** Voltar a uma política do
tipo `FOR ALL TO authenticated` reabre exatamente a falha que a versão atual
fecha. É por isso que as migrações não têm reversão para o estado anterior.

## Desenvolvimento

```bash
npm run dev              # servidor local
npm run lint             # análise estática
npm test                 # testes unitários (rápidos, sem dependências)
npm run test:integration # testes contra um Supabase real
npm run test:e2e         # percursos completos no navegador
npm run db:types         # regenera types/database.ts a partir do schema
```

### Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

As duas primeiras são públicas por natureza — vão no pacote JavaScript enviado ao
navegador. A terceira **nunca** pode chegar ao cliente: ela vive isolada em
`lib/supabase/admin.ts`, protegida pelo pacote `server-only`, que faz a
compilação falhar caso algum componente de cliente tente importá-la.

### Testes e segurança

Os testes de integração criam usuários e escrevem no banco. Existe uma trava em
`tests/setup/guarda-ambiente.ts` que **aborta a execução** se detectar o projeto
de produção — nunca aponte os testes para lá.

A suíte `tests/integration/acesso-negado.test.ts` reproduz uma cadeia de ataque
real, confirmada contra produção em 25/07/2026, e exige que todos os passos
falhem. Qualquer alteração nas regras de acesso precisa passar por ela.
