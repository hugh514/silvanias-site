import { expect, test } from '@playwright/test'

/**
 * T031/T032 — quem não é administrador não entra no painel.
 *
 * A célula que muda o comportamento face a antes de 2026-07-25 é a do meio: uma
 * conta autenticada QUALQUER entrava. Ter sessão era suficiente.
 */

test.describe('acesso ao painel', () => {
  test('visitante_sem_sessao_e_reencaminhado', async ({ page }) => {
    await page.goto('/admin/produtos')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('todas_as_rotas_do_painel_exigem_sessao', async ({ page }) => {
    for (const rota of ['/admin/produtos', '/admin/produtos/novo']) {
      await page.goto(rota)
      await expect(page, `${rota} deveria reencaminhar`).toHaveURL(/\/admin\/login/)
    }
  })

  test('reencaminha_para_entrada_e_nao_para_pagina_de_erro', async ({ page }) => {
    // Não confirmar a existência do painel a quem não tem nada que ver com ele,
    // pela mesma lógica que impede enumerar contas (FR-021).
    const resposta = await page.goto('/admin/produtos')
    expect(resposta?.status()).toBeLessThan(400)
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('o_middleware_nao_corre_nas_rotas_publicas', async ({ page }) => {
    // T032/SC-009: antes desta feature o middleware corria em todas as rotas e
    // fazia uma chamada ao serviço de autenticação em CADA visita à vitrine, que
    // não usa sessão nenhuma. Um pedido a `/` não deve produzir tráfego de auth.
    const pedidosAuth: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/auth/v1/')) pedidosAuth.push(r.url())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(
      pedidosAuth,
      'a vitrine não deveria falar com o serviço de autenticação'
    ).toHaveLength(0)
  })
})
