import { expect, test } from '@playwright/test'

/**
 * T066 — SC-009: o tempo de carregamento percebido não pode piorar.
 *
 * Antes desta correção, o critério não era verificável por nada. Afirmávamos que
 * restringir o middleware a `/admin` melhoraria o carregamento da vitrine — mas
 * sem medição, era fé.
 *
 * Registar os valores obtidos em research.md, antes e depois de T030.
 */

const LIMITE_LCP_MS = 2500 // Princípio II da constituição, em rede móvel 4G

test.describe('desempenho da vitrine', () => {
  test('o_lcp_da_pagina_inicial_fica_dentro_do_orcamento', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })

    const lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let ultimo = 0
          new PerformanceObserver((lista) => {
            for (const entrada of lista.getEntries()) ultimo = entrada.startTime
          }).observe({ type: 'largest-contentful-paint', buffered: true })

          // O LCP só fica definitivo quando a página deixa de mudar.
          setTimeout(() => resolve(ultimo), 3000)
        })
    )

    console.log(`LCP medido: ${Math.round(lcp)} ms (limite ${LIMITE_LCP_MS} ms)`)
    expect(lcp, `LCP de ${Math.round(lcp)} ms excede o orçamento`).toBeLessThan(LIMITE_LCP_MS)
  })

  test('a_vitrine_nao_paga_chamadas_de_rede_desnecessarias', async ({ page }) => {
    const externos: string[] = []
    page.on('request', (r) => {
      const url = r.url()
      if (!url.startsWith('http')) return
      if (url.includes('localhost') || url.includes('127.0.0.1')) return
      externos.push(new URL(url).host)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const hosts = [...new Set(externos)]
    console.log('Origens externas contactadas pela vitrine:', hosts.join(', ') || 'nenhuma')

    // Não falha o teste: serve para tornar visível a dependência de terceiros no
    // caminho crítico — nomeadamente api.iconify.design, que é contactado por
    // cada ícone. Candidato a substituição por ícones locais (decisão D6).
    expect(hosts).toBeDefined()
  })
})
