import { test, expect } from '@playwright/test'

// Guards the files AI crawlers and agents read. If one of these breaks,
// answer engines silently lose (or misread) the AIntern proposition.

test.describe('GEO-bestanden', () => {
  test('robots.txt splitst answer-engines en training-crawlers', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain('Content-Signal:')
    // Agents are grouped: several User-agent lines share one rule set.
    expect(body).toMatch(/User-agent: ClaudeBot\r?\n(?:User-agent: .*\r?\n)*Allow: \/\r?\n/)
    expect(body).toMatch(/User-agent: CCBot\r?\n(?:User-agent: .*\r?\n)*Disallow: \/\r?\n/)
    expect(body).toContain('Disallow: /admin')
    expect(body).toContain('Sitemap: https://aintern.nl/sitemap.xml')
    expect(body).toContain('schemamap: https://aintern.nl/schemamap.xml')
  })

  test('llms.txt draagt de nieuwe propositie', async ({ request }) => {
    const body = await (await request.get('/llms.txt')).text()
    expect(body).toContain('Stop met huren')
    expect(body).toContain('/agents.md')
    expect(body.toLowerCase()).not.toContain('no-cure')
  })

  test('schemamap.xml verwijst naar de FAQ-feed', async ({ request }) => {
    const res = await request.get('/schemamap.xml')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('https://aintern.nl/feeds/faq.jsonl')
  })

  test('feeds/faq.jsonl bevat geldige Question-regels', async ({ request }) => {
    const res = await request.get('/feeds/faq.jsonl')
    expect(res.ok()).toBeTruthy()
    const lines = (await res.text()).trim().split('\n')
    expect(lines.length).toBe(6)
    for (const line of lines) {
      const item = JSON.parse(line)
      expect(item['@type']).toBe('Question')
      expect(item.name).toBeTruthy()
      expect(item.acceptedAnswer.text).toBeTruthy()
    }
  })

  test('.well-known/ard.json verwijst naar bereikbare bronnen', async ({ request }) => {
    const res = await request.get('/.well-known/ard.json')
    expect(res.ok()).toBeTruthy()
    const ard = await res.json()
    expect(Array.isArray(ard.entries)).toBeTruthy()
    expect(ard.entries.length).toBeGreaterThan(0)
    // Static entries on this host must resolve; API endpoints are checked elsewhere.
    for (const entry of ard.entries) {
      const url: string = entry.url ?? ''
      if (/\.(md|txt|jsonl)$/.test(url)) {
        const path = new URL(url).pathname
        expect((await request.get(path)).ok(), path).toBeTruthy()
      }
    }
  })

  test('.well-known/agent-skills/index.json is geldig', async ({ request }) => {
    const res = await request.get('/.well-known/agent-skills/index.json')
    expect(res.ok()).toBeTruthy()
    const index = await res.json()
    expect(Array.isArray(index.skills)).toBeTruthy()
    expect(index.skills.length).toBeGreaterThan(0)
  })

  for (const file of ['index', 'platform', 'partners', 'agents', 'about', 'privacy']) {
    test(`${file}.md is bereikbaar`, async ({ request }) => {
      const res = await request.get(`/${file}.md`)
      expect(res.ok()).toBeTruthy()
      expect(await res.text()).toMatch(/^# /m)
    })
  }
})

test.describe('About- en privacypagina', () => {
  for (const path of ['/about', '/privacy']) {
    test(`${path} rendert met h1 en markdown-alternate`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator(`link[rel="alternate"][href="${path}.md"]`)).toBeAttached()
    })
  }

  test('footer linkt naar about en privacy', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer.locator('a[href="/about"]')).toBeVisible()
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible()
  })
})
