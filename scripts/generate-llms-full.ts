import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSlugsFromS3, getNewsflowSlugsFromS3 } from './generate-sitemap'

const HOSTNAME = 'https://aintern.nl'
const S3_BASE = 'https://aintern-kennisbank.s3.eu-west-2.amazonaws.com'
const NEWSFLOW_S3_BASE = 'https://aintern-newsflow.s3.eu-west-2.amazonaws.com'

interface BlogPost {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
  content: string
}

interface NewsFlowArticle {
  slug: string
  title: string
  metaDescription: string
  lezersvraag: string
  publishedAt: string
  sections: {
    intro: string
    context: string
    mkbRelevantie: string
    ainternAngle: string
    bronnen: Array<{ title: string; url: string }>
  }
  faq: Array<{ question: string; answer: string }>
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(h[1-6]|p|li|blockquote|br|div|tr)[^>]*>/gi, '\n')
    .replace(/<(br|hr)[^>]*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function fetchArticle(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${S3_BASE}/posts/${slug}.json`)
    if (!response.ok) return null
    return (await response.json()) as BlogPost
  } catch {
    return null
  }
}

async function fetchNewsflowArticle(slug: string): Promise<NewsFlowArticle | null> {
  try {
    const response = await fetch(`${NEWSFLOW_S3_BASE}/posts/${slug}.json`)
    if (!response.ok) return null
    return (await response.json()) as NewsFlowArticle
  } catch {
    return null
  }
}

// The static part of llms-full.txt is assembled from the markdown pages in
// public/ so there is one source of truth for the proposition text.
const STATIC_PAGES = ['index.md', 'platform.md', 'partners.md', 'agents.md', 'about.md', 'privacy.md']

function buildStaticHeader(today: string, publicDir: string): string {
  const pages = STATIC_PAGES.flatMap((file) => {
    try {
      // Demote headings one level so each page nests under the document title
      const md = readFileSync(resolve(publicDir, file), 'utf-8').replace(/^(#{1,5}) /gm, '#$1 ')
      return [md.trim(), '', '---', '']
    } catch {
      console.warn(`[llms-full] ${file} niet gevonden — overgeslagen`)
      return []
    }
  })

  return [
    `# AIntern — Volledige LLM-gids`,
    ``,
    `> Stop met huren. Bouw wat van jou is. Eigen software voor het MKB, vanaf €99 per maand.`,
    `> Laatste update: ${today}`,
    ``,
    `---`,
    ``,
    ...pages,
  ].join('\n')
}

function buildArticleSection(articles: BlogPost[]): string {
  const sorted = [...articles].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))

  const blocks = sorted.map((article) => {
    const plainBody = htmlToPlainText(article.content)
    return [
      `### ${article.title}`,
      ``,
      `**Categorie:** ${article.category}`,
      `**URL:** ${HOSTNAME}/kennisbank/${article.slug}`,
      `**Gepubliceerd:** ${article.publishedAt}`,
      ``,
      article.excerpt,
      ``,
      plainBody,
      ``,
      `---`,
    ].join('\n')
  })

  return [
    `## Kennisbank — Volledige artikelen`,
    ``,
    `Alle artikelen zijn Nederlandstalig, gericht op MKB-eigenaren zonder technische achtergrond.`,
    ``,
    ...blocks,
  ].join('\n')
}

function buildNewsflowSection(articles: NewsFlowArticle[]): string {
  if (articles.length === 0) return ''

  const sorted = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const blocks = sorted.map((article) => {
    const intro = htmlToPlainText(article.sections.intro)
    const context = htmlToPlainText(article.sections.context)
    const mkbRelevantie = htmlToPlainText(article.sections.mkbRelevantie)
    const faqLines = article.faq
      .map((f) => `**V: ${f.question}**\nA: ${f.answer}`)
      .join('\n\n')
    return [
      `### ${article.title}`,
      ``,
      `**URL:** ${HOSTNAME}/newsflow/${article.slug}`,
      `**Gepubliceerd:** ${article.publishedAt.slice(0, 10)}`,
      `**Lezersvraag:** ${article.lezersvraag}`,
      ``,
      intro,
      ``,
      context,
      ``,
      mkbRelevantie,
      ``,
      faqLines,
      ``,
      `---`,
    ].join('\n')
  })

  return [
    `## NewsFlow — Dagelijks MKB-nieuws`,
    ``,
    `Dagelijkse landingspagina's over actueel nieuws met AI-automatiseringsadvies voor MKB-ondernemers.`,
    ``,
    ...blocks,
  ].join('\n')
}

export async function generateLlmsFullTxt(outDir: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  let articles: BlogPost[] = []
  let newsflowArticles: NewsFlowArticle[] = []

  try {
    const slugs = await getSlugsFromS3()
    const results = await Promise.all(slugs.map((slug) => fetchArticle(slug)))
    articles = results.filter((a): a is BlogPost => a !== null)
    console.log(`[llms-full] ${articles.length}/${slugs.length} kennisbank artikelen opgehaald uit S3`)
  } catch (err) {
    console.warn('[llms-full] Kennisbank S3 ophalen mislukt:', err)
  }

  try {
    const slugs = await getNewsflowSlugsFromS3()
    const results = await Promise.all(slugs.map((slug) => fetchNewsflowArticle(slug)))
    newsflowArticles = results.filter((a): a is NewsFlowArticle => a !== null)
    console.log(`[llms-full] ${newsflowArticles.length}/${slugs.length} newsflow pagina's opgehaald uit S3`)
  } catch (err) {
    console.warn('[llms-full] Newsflow S3 ophalen mislukt:', err)
  }

  const newsflowSection = buildNewsflowSection(newsflowArticles)

  const content = [
    buildStaticHeader(today, outDir),
    ``,
    buildArticleSection(articles),
    ...(newsflowSection ? [``, newsflowSection] : []),
    ``,
    `## Contact`,
    ``,
    `- **Website:** ${HOSTNAME}`,
    `- **E-mail:** info@aintern.nl`,
    `- **Kennisbank:** ${HOSTNAME}/kennisbank`,
    `- **Sitemap:** ${HOSTNAME}/sitemap.xml`,
    `- **llms.txt:** ${HOSTNAME}/llms.txt`,
    `- **Gids voor agents:** ${HOSTNAME}/agents.md`,
    `- **Schema feeds:** ${HOSTNAME}/schemamap.xml`,
    `- **MCP-server (voor AI-assistenten):** ${HOSTNAME}/mcp — doorzoekbare Q&A over AI-automatisering voor het MKB via het Model Context Protocol (Streamable HTTP, geen authenticatie)`,
    `- **NLWeb /ask (voor AI-assistenten):** ${HOSTNAME}/ask?query=... — dezelfde Q&A als schema.org Question-resultaten (GET of POST)`,
    ``,
  ].join('\n')

  const dest = resolve(outDir, 'llms-full.txt')
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, content, 'utf-8')
  console.log(`[llms-full] Geschreven naar ${dest} (${articles.length} artikelen, ${content.length} tekens)`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const publicDir = resolve(process.cwd(), 'public')
  generateLlmsFullTxt(publicDir).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
