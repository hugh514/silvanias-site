import { expect, test, type Page } from '@playwright/test'

/**
 * Percurso completo do painel: entrar, criar (com ordem e destaque), ver na
 * vitrine, editar, remover, editar textos do site, sair.
 *
 * Exige uma conta em public.admins no ambiente apontado (no Supabase local:
 * admin@local.dev / admin123, ver supabase/seed.sql). Sem E2E_EMAIL e
 * E2E_PASSWORD os testes são saltados. NUNCA usar as credenciais de produção.
 */

const EMAIL = process.env.E2E_EMAIL
const SENHA = process.env.E2E_PASSWORD
const LISTA = /\/admin\/produtos(\?.*)?$/

async function entrar(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(EMAIL!)
  await page.getByLabel('Senha', { exact: true }).fill(SENHA!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(LISTA)
}

test.describe('painel de administração', () => {
  test.skip(!EMAIL || !SENHA, 'E2E_EMAIL e E2E_PASSWORD não definidos.')
  test.describe.configure({ mode: 'serial' })

  const nomeProduto = `Teste automatizado ${Date.now()}`

  test.beforeEach(async ({ page }) => entrar(page))

  test('criar_produto_em_destaque_aparece_primeiro_na_vitrine', async ({ page }) => {
    await page.goto('/admin/produtos/novo')
    await page.getByLabel('Nome do produto').fill(nomeProduto)
    await page.getByLabel('Categoria').selectOption({ index: 0 })
    await page.getByLabel('Descrição').fill('Criado por teste automatizado.')
    await page.getByLabel('Ordem no catálogo').fill('-9999')
    await page.getByLabel('Destaque na vitrine').check()
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page).toHaveURL(/aviso=criado/)
    await expect(page.getByRole('status')).toContainText('cadastrado')
    await expect(page.getByRole('link', { name: nomeProduto }).first()).toBeVisible()

    await page.goto('/')
    const primeiro = page.locator('#catalogo a[href^="/produtos/"]').first()
    await expect(primeiro).toContainText(nomeProduto)
    await expect(primeiro).toContainText('Destaque')
  })

  test('recusa_produto_sem_nome', async ({ page }) => {
    await page.goto('/admin/produtos/novo')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page).toHaveURL(/\/admin\/produtos\/novo/)
    await expect(page.getByText(/informe o nome/i)).toBeVisible()
  })

  test('editar_e_remover_produto', async ({ page }) => {
    await page.getByRole('link', { name: `Editar ${nomeProduto}` }).click()
    await expect(page).toHaveURL(/\/admin\/produtos\/[0-9a-f-]+/)

    await page.getByLabel('Nome do produto').fill(`${nomeProduto} editado`)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/aviso=salvo/)

    await page.getByRole('link', { name: `Editar ${nomeProduto} editado` }).click()
    await page.getByRole('button', { name: 'Excluir' }).first().click()
    await page.getByRole('button', { name: 'Excluir' }).last().click()

    await expect(page).toHaveURL(/aviso=excluido/)
    await expect(page.getByText(`${nomeProduto} editado`)).toHaveCount(0)
  })

  test('editar_texto_do_site_aparece_na_vitrine', async ({ page }) => {
    const frase = `Faixa de teste ${Date.now()}`
    await page.goto('/admin/conteudo')
    const faixa = page.locator('form', { has: page.locator('#marquee-mensagem') })
    const original = await faixa.locator('#marquee-mensagem').inputValue()

    await faixa.locator('#marquee-mensagem').fill(frase)
    await faixa.getByRole('button', { name: 'Salvar' }).click()
    await expect(faixa.getByRole('status')).toBeVisible()

    await page.goto('/')
    await expect(page.getByText(frase).first()).toBeAttached()

    // Repõe o texto para não deixar lixo no ambiente.
    await page.goto('/admin/conteudo')
    await faixa.locator('#marquee-mensagem').fill(original)
    await faixa.getByRole('button', { name: 'Salvar' }).click()
    await expect(faixa.getByRole('status')).toBeVisible()
  })

  test('sair_do_painel', async ({ page }) => {
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/admin\/login/)

    // A sessão tem mesmo de acabar, não apenas mudar de página.
    await page.goto('/admin/produtos')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
