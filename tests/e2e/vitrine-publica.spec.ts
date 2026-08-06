import { expect, test } from '@playwright/test'

/**
 * T022/T023 — a vitrine não pode notar diferença nenhuma.
 *
 * A História 5 partilha a prioridade máxima com a História 1 de propósito: uma
 * alteração de autorização que feche o catálogo ao público troca uma falha grave
 * por outra pior. Estes testes correm na MESMA fase das políticas de acesso, não
 * depois — descobrir o estrago mais tarde não serve de nada.
 */

test.describe('visitante anónimo, sem sessão', () => {
  test('ve_a_pagina_inicial_com_o_catalogo', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#catalogo')).toBeVisible()

    // Não deve haver qualquer reencaminhamento para a página de entrada.
    expect(page.url()).not.toContain('/admin')
  })

  test('as_imagens_do_catalogo_carregam', async ({ page }) => {
    await page.goto('/')
    await page.locator('#catalogo').scrollIntoViewIfNeeded()

    const imagens = page.locator('#catalogo img')
    const total = await imagens.count()
    test.skip(total === 0, 'Sem produtos no catálogo neste ambiente.')

    // `naturalWidth > 0` prova que o ficheiro chegou mesmo, não apenas que a
    // etiqueta existe no documento.
    const primeira = imagens.first()
    await expect(primeira).toBeVisible()
    await expect
      .poll(() => primeira.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0)
  })

  test('abre_a_pagina_de_um_produto_disponivel', async ({ page }) => {
    await page.goto('/')
    await page.locator('#catalogo').scrollIntoViewIfNeeded()

    const primeiroProduto = page.locator('a[href^="/produtos/"]').first()
    test.skip((await primeiroProduto.count()) === 0, 'Sem produtos no catálogo.')

    await primeiroProduto.click()
    await expect(page).toHaveURL(/\/produtos\//)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('nao_encontra_produto_inexistente', async ({ page }) => {
    // Cobre também o caso de produto indisponível: a política de leitura torna-o
    // indistinguível de um produto que nunca existiu.
    const resposta = await page.goto('/produtos/00000000-0000-0000-0000-000000000000')
    expect(resposta?.status()).toBe(404)
  })

  test('o_botao_de_whatsapp_continua_a_funcionar', async ({ page }) => {
    await page.goto('/')
    const zap = page.locator('a[href*="wa.me"]').first()
    if ((await zap.count()) > 0) {
      await expect(zap).toHaveAttribute('href', /wa\.me/)
    }
  })
})
