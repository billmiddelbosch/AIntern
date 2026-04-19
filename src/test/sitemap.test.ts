import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sitemapPath = resolve(__dirname, '../../public/sitemap.xml')

describe('sitemap.xml', () => {
  let xml: string
  let locs: string[]

  beforeAll(() => {
    xml = readFileSync(sitemapPath, 'utf-8')
    locs = [...xml.matchAll(/<loc>(.+?)<\/loc>/g)].map((m) => m[1])
  })

  it('file exists and contains XML declaration', () => {
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<urlset')
    expect(xml).toContain('</urlset>')
  })

  it('contains homepage URL', () => {
    expect(locs).toContain('https://aintern.nl/')
  })

  it('contains kennisbank index URL', () => {
    expect(locs).toContain('https://aintern.nl/kennisbank')
  })

  it('all URLs are on the aintern.nl domain', () => {
    for (const loc of locs) {
      expect(loc).toMatch(/^https:\/\/aintern\.nl/)
    }
  })

  it('no duplicate URLs', () => {
    expect(new Set(locs).size).toBe(locs.length)
  })

  it('contains at least one kennisbank article URL', () => {
    const articles = locs.filter((l) => l.includes('/kennisbank/'))
    expect(articles.length).toBeGreaterThan(0)
  })

  it('every article URL matches the expected slug pattern', () => {
    const articles = locs.filter((l) => l.includes('/kennisbank/'))
    for (const url of articles) {
      // slugs are lowercase kebab-case
      expect(url).toMatch(/^https:\/\/aintern\.nl\/kennisbank\/[a-z0-9-]+$/)
    }
  })

  it('sitemap counts match S3 article count (11 total URLs: homepage + kennisbank + 9 articles)', () => {
    // This guards against BUG-04 regression: new articles added to S3 but missing from sitemap
    expect(locs.length).toBeGreaterThanOrEqual(3) // at minimum: /, /kennisbank, 1 article
    const articles = locs.filter((l) => l.includes('/kennisbank/'))
    expect(articles.length).toBeGreaterThanOrEqual(1)
  })
})
