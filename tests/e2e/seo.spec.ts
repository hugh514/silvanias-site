import { expect, test } from '@playwright/test'

/** T045 — SEO básico: sitemap, robots e metadados Open Graph. */

test.describe('seo', () => {
  test('sitemap_xml_responde_200', async ({ request }) => {
    const resposta = await request.get('/sitemap.xml')
    expect(resposta.status()).toBe(200)
    expect(await resposta.text()).toContain('<urlset')
  })

  test('robots_txt_bloqueia_admin', async ({ request }) => {
    const resposta = await request.get('/robots.txt')
    expect(resposta.status()).toBe(200)
    expect(await resposta.text()).toContain('Disallow: /admin')
  })

  test('home_tem_og_title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
  })
})
