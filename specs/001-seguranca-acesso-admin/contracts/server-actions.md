# Contrato — Ações de Servidor

**Feature**: Segurança de Acesso ao Painel Administrativo
**Data**: 2026-07-25

Substituem as escritas que hoje partem do navegador em `components/admin/ProdutoForm.tsx`
(envio nas linhas 78-80, criação e alteração em 104-109, remoção em 134 e 137-140) e a
autenticação em `components/admin/LoginForm.tsx:22-25`.

---

## Invariantes comuns

Toda a ação que escreve cumpre esta ordem, sem exceção:

| # | Passo | Se falhar |
|---|-------|-----------|
| 1 | Obter a sessão do pedido | devolve erro de não autenticado |
| 2 | Verificar `is_admin()` | devolve erro de não autorizado |
| 3 | Validar a entrada com o esquema partilhado | devolve erros por campo |
| 4 | Executar a escrita | devolve erro genérico em português |
| 5 | Revalidar os caminhos afetados | — |

**O passo 2 nunca é saltado**, mesmo quando o passo 4 vai correr sob uma credencial que as
políticas já restringem. A verificação da aplicação e as políticas da base de dados são
camadas independentes; confiar apenas numa é o padrão que causou esta feature.

**Nenhuma ação recebe o identificador de quem a chama como argumento.** A identidade vem
sempre da sessão do pedido. Um argumento de identidade seria falsificável pelo chamador.

---

## Forma do resultado

Todas as ações devolvem uma forma discriminada, nunca lançam para o cliente:

| Campo | Quando | Conteúdo |
|-------|--------|----------|
| `ok: true` | sucesso | eventuais dados |
| `ok: false`, `erro` | falha | mensagem em português, apta a mostrar ao utilizador |
| `ok: false`, `camposComErro` | falha de validação | mensagem por campo |

**Regra de FR-029**: a mensagem nunca inclui texto vindo da base de dados. Falhas técnicas
são registadas do lado do servidor e devolvidas como mensagem genérica. Um erro cru de
Postgres devolvido ao navegador revela nomes de tabelas, colunas e restrições.

---

## `criarProduto`

**Entrada**: dados do formulário — nome, categoria, ingredientes, descrição,
disponibilidade, e os ficheiros das fotos.

**Comportamento**:

1. Invariantes 1 a 3.
2. Para cada ficheiro: validar assinatura de conteúdo, tamanho e derivar a extensão do tipo
   real. Gerar o nome. Enviar.
3. Se qualquer envio falhar, **remover os ficheiros já enviados nesta operação** antes de
   devolver o erro. Sem isto ficam órfãos a ocupar espaço.
4. Inserir a linha com os endereços resultantes.
5. Revalidar a listagem do painel, a página inicial e a página do produto.

**Recusa**: sem sessão; não administrador; nome vazio; categoria fora da lista conhecida;
mais de 4 fotos; ficheiro que não é imagem dos formatos aceites; ficheiro acima de 5 MB.

---

## `atualizarProduto`

**Entrada**: identificador do produto e os mesmos campos, mais a lista de fotos a manter.

**Comportamento**: como acima, com duas diferenças. As fotos existentes que continuam na
lista são preservadas sem novo envio. As fotos que saíram da lista são removidas do
armazenamento depois de a linha ser gravada com sucesso — por essa ordem, para que uma
falha na gravação não deixe o produto a apontar para ficheiros que já não existem.

**Recusa**: as mesmas, mais produto inexistente.

---

## `removerProduto`

**Entrada**: identificador do produto.

**Comportamento**:

1. Invariantes 1 e 2.
2. Ler a linha para obter os endereços das fotos.
3. Derivar os caminhos de armazenamento **recortando pelo prefixo completo de
   armazenamento**, não pelo fragmento `/produtos/` — a fragilidade de
   `ProdutoForm.tsx:130`.
4. Remover os ficheiros.
5. Remover a linha.
6. Revalidar os mesmos caminhos.

**Ordem deliberada**: ficheiros primeiro. Se a remoção da linha falhar depois, ficam
ficheiros em falta para um produto que ainda existe — visível e corrigível. A ordem
inversa deixaria ficheiros órfãos invisíveis.

**Recusa**: sem sessão; não administrador; produto já inexistente, com mensagem clara em
vez de erro cru (caso limite da especificação: duas administradoras em simultâneo).

---

## `entrar`

Substitui a chamada direta em `LoginForm.tsx:22-25`.

**Entrada**: endereço de correio e palavra-passe.

**Comportamento**:

1. Determinar a origem do pedido a partir dos cabeçalhos.
2. Consultar `entrada_bloqueada(origem)`. Se verdadeiro, recusar sem sequer tentar
   autenticar.
3. Tentar autenticar.
4. Em caso de falha: `registar_tentativa_falhada(origem)` e devolver a mensagem genérica.
5. Em caso de sucesso: `limpar_tentativas(origem)` e encaminhar para o painel.

**FR-021**: a mensagem de falha é **exatamente a mesma** para endereço inexistente, palavra
-passe errada e conta existente sem administração. Qualquer diferença — no texto, ou no
tempo de resposta — permite enumerar contas.

**Nota**: uma conta válida mas ausente de `admins` autentica com sucesso e é depois
reencaminhada pelo middleware. A distinção não é exposta nesta ação.

---

## `sair`

Termina a sessão e reencaminha. Não existe hoje — não há forma de sair do painel.

**Não exige** verificação de administração: qualquer sessão pode ser terminada por quem a
detém.

---

## Módulos de apoio

### `lib/schemas/produto.ts`

Um esquema, importado pelo formulário e pelas ações. O cliente valida por cortesia de
experiência; o servidor revalida sempre (Princípio III). Regras na tabela de validação do
[modelo de dados](../data-model.md).

### `lib/upload/validar-imagem.ts`

Funções puras, sem dependência de rede ou de base de dados — logo, diretamente testáveis em
teste unitário, que é onde o Princípio VI quer o esforço barato.

| Função | Papel |
|--------|-------|
| detetar tipo real | compara os bytes iniciais com as assinaturas conhecidas; devolve o tipo ou nada |
| validar ficheiro | aplica tipo e tamanho; devolve resultado com motivo em português |
| gerar nome | produz `{identificador}.{extensão}` a partir do tipo **detetado**, descartando o nome recebido |
| derivar caminho | extrai o caminho de armazenamento de um endereço público, pelo prefixo completo |

### `lib/supabase/admin.ts`

```
import 'server-only'
```

na primeira linha. Se um ficheiro de navegador o importar, a construção falha (FR-028).

**Regra de utilização**: usado apenas onde a operação exige mesmo desvio às políticas.
Escritas normais de produto correm com a sessão da administradora, para que as políticas
continuem a valer como segunda camada. Recorrer à credencial de serviço para tudo
anularia o benefício de as ter.
