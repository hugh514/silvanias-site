import { expect, test } from '@playwright/test'

/**
 * T060 — percurso completo do painel: entrar, criar, editar, remover, sair.
 *
 * Exige credenciais de uma conta que conste de public.admins no ambiente
 * apontado. Sem elas, os testes são saltados em vez de falhar — não faz sentido
 * pintar a integração contínua de vermelho por falta de configuração opcional.
 *
 * Definir E2E_EMAIL e E2E_PASSWORD. NUNCA usar as credenciais de produção.
 */

const EMAIL = process.env.E2E_EMAIL
const SENHA = process.env.E2E_PASSWORD

test.describe('painel de administração', () => {
  test.skip(!EMAIL || !SENHA, 'E2E_EMAIL e E2E_PASSWORD não definidos.')
  test.describe.configure({ mode: 'serial' })

  const nomeProduto = `Teste automatizado ${Date.now()}`

  test('entrar_no_painel', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByPlaceholder('Email').fill(EMAIL!)
    await page.getByPlaceholder('Senha').fill(SENHA!)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/admin\/produtos/)
  })

  test('criar_produto', async ({ page }) => {
    await page.goto('/admin/produtos/novo')

    await page.getByLabel('Nome do produto').fill(nomeProduto)
    await page.getByLabel('Categoria').selectOption({ index: 0 })
    await page.getByLabel('Descrição').fill('Criado por teste automatizado.')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page).toHaveURL(/\/admin\/produtos$/)
    await expect(page.getByText(nomeProduto)).toBeVisible()
  })

  test('recusa_produto_sem_nome', async ({ page }) => {
    await page.goto('/admin/produtos/novo')
    await page.getByRole('button', { name: 'Salvar' }).click()

    // Continua na mesma página, com erro visível — não grava em silêncio.
    await expect(page).toHaveURL(/\/admin\/produtos\/novo/)
    await expect(page.getByText(/informe o nome/i)).toBeVisible()
  })

  test('editar_e_remover_produto', async ({ page }) => {
    await page.goto('/admin/produtos')
    await page.getByText(nomeProduto).click()

    await expect(page).toHaveURL(/\/admin\/produtos\/[0-9a-f-]+/)

    await page.getByLabel('Nome do produto').fill(`${nomeProduto} editado`)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/admin\/produtos$/)

    await page.getByText(`${nomeProduto} editado`).click()
    await page.getByRole('button', { name: 'Excluir' }).first().click()
    await page.getByRole('button', { name: 'Excluir' }).last().click()

    await expect(page).toHaveURL(/\/admin\/produtos$/)
    await expect(page.getByText(`${nomeProduto} editado`)).toHaveCount(0)
  })

  test('sair_do_painel', async ({ page }) => {
    // FR-030 — antes desta feature não havia forma de terminar a sessão.
    await page.goto('/admin/produtos')
    await page.getByRole('button', { name: /sair/i }).click()

    await expect(page).toHaveURL(/\/admin\/login/)

    // A sessão tem mesmo de acabar, não apenas mudar de página.
    await page.goto('/admin/produtos')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
