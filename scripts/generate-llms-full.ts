import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSlugsFromS3 } from './generate-sitemap'

const HOSTNAME = 'https://aintern.nl'
const S3_BASE = 'https://aintern-kennisbank.s3.eu-west-2.amazonaws.com'

interface BlogPost {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
  content: string
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

function buildStaticHeader(today: string): string {
  return `# AIntern — Volledige LLM-gids

> AIntern bouwt dedicated AI-stagiaires voor MKB-bedrijven in Nederland — no-cure-no-pay.
> Laatste update: ${today}

AIntern helpt Nederlandse MKB-bedrijven (1–50 medewerkers) herhaalprocessen automatiseren met een op maat gebouwde AI-stagiaire. Klanten betalen uitsluitend bij meetbaar, bewezen resultaat.

---

## Over AIntern

**Missie:** Elk MKB-bedrijf een dedicated AI-stagiaire geven — een die de interne processen van dat specifieke bedrijf uitvoert als een extra medewerker, zonder overhead.

**Model:** No-cure-no-pay. AIntern definieert samen met de klant vooraf meetbare succescriteria. Geen resultaat = geen factuur.

**Aanpak in drie stappen:**
1. Gratis procesanalyse (30 minuten) — vrijblijvend, geen verkooppraatje
2. 2-weken pilot — werkende AI-oplossing bouwen voor het gekozen proces
3. Live implementatie — betaling start pas na verificatie van de resultaten

**Capaciteitsbeperking:** AIntern neemt maximaal 2 nieuwe klanten per kwartaal aan om kwaliteit te garanderen.

---

## Bewezen resultaten (geverifieerde cijfers)

- **40% tijdsbesparing** op herhaalprocessen (gemeten over actieve klanttrajecten)
- **€1.200+ maandelijkse kostenbesparing** (gemiddelde besparing op arbeidskosten per klant)
- **90% minder gegevensinvoerfouten** na AI-implementatie
- **Implementatietijd:** 4–8 weken van analyse tot live deployment
- **Lightspeed case:** productinvoer gereduceerd van 60 minuten naar 5 minuten per batch

---

## Dienstverlening

### Geautomatiseerde processen (voorbeelden)
- Factuurverwerking en boekhoudkundige data-extractie
- Productteksten schrijven en uploaden (Lightspeed, WooCommerce, Shopify)
- Klantemails categoriseren en beantwoorden
- Offertes opstellen op basis van vaste formats
- Rapportages genereren uit ruwe data
- Voorraadbeheer en inkoopsignalen

### Sectoren
- E-commerce / webshops (sterk vertegenwoordigd)
- Groothandel en distributie
- Administratieve dienstverleners
- Retail (fysiek + online)

### Technisch
- GDPR-conform — klantdata verlaat nooit de afgesproken verwerkingscontext
- Geen technische kennis vereist van de klant
- Integratie met bestaande software (Lightspeed, e-mailclients, Google Workspace)

---

## Prijsmodel

- **Geen voorinvestering** — nul euro upfront
- **Gratis analyse** — eerste gesprek en procesanalyse zijn altijd gratis
- **Resultaatgebaseerde vergoeding** — percentage van behaalde besparing of vaste fee op basis van scope
- Betaling start pas na meting en verificatie van de afgesproken succescriteria

---

## Veelgestelde vragen

**Wat betekent no-cure-no-pay precies?**
Je betaalt alleen als de AI-oplossing aantoonbaar resultaat oplevert. Wij definiëren samen met jou vooraf meetbare doelen — zoals tijdsbesparing, kostenverlaging of verhoogde output. Halen we die doelen niet? Dan betaal je niets.

**Hoe lang duurt een gemiddeld traject?**
De meeste trajecten duren vier tot acht weken van analyse tot live implementatie. Complexere processen kunnen langer duren, maar je hebt altijd zicht op de planning en tussentijdse mijlpalen.

**Moet ik technische kennis hebben?**
Nee. AIntern regelt de volledige technische implementatie. Jij hoeft alleen te vertellen hoe je bedrijfsproces nu werkt en wat je wilt bereiken. Wij vertalen dat naar een werkende AI-oplossing.

**Wat als de AI-oplossing niet werkt voor mijn bedrijf?**
We beginnen altijd met een gratis analyse van jouw processen. Als we zien dat AI geen significante winst oplevert voor jouw specifieke situatie, zeggen we dat eerlijk — zodat je geen tijd en geld verspilt.

**Zijn mijn bedrijfsgegevens veilig?**
Ja. We werken uitsluitend met GDPR-conforme oplossingen en verwerken jouw bedrijfsdata nooit buiten de afgesproken context. Vertrouwelijkheid is een basisvereiste, geen optie.

**Wat kost het als het wél resultaat oplevert?**
De vergoeding is gebaseerd op een percentage van de behaalde besparing of een vaste fee die we samen bepalen op basis van de scope. Je betaalt pas als de resultaten zijn gemeten en geverifieerd.

---

## Pagina-overzicht

### Hoofdpagina's

**Homepage** — ${HOSTNAME}/
Overzicht van de dienst: hero-sectie, hoe het werkt, het aanbod, portfolio van cases, problemen en oplossingen, FAQ, contactsectie.

**AI Agent voor MKB** — ${HOSTNAME}/ai-agent-mkb
Uitgebreide uitleg over AI-agents voor het MKB: wat een AI-agent doet, concrete use cases (productinvoer, klantvragen, offertes), no-cure-no-pay uitleg.

**Wat kost handmatig werk jou?** — ${HOSTNAME}/wat-kost-handmatig-werk
Interactieve calculator: voer uren per week, uurtarief en aantal processen in. Toont wekelijkse, maandelijkse en jaarlijkse kostenbesparingen bij 70% AI-automatiseringsgraad.

**Gratis AI Workflow Scan** — ${HOSTNAME}/workflow-scan
Gratis diagnose-tool in 3 minuten: beantwoord vragen over herhaalprocessen, krijg top-3 knelpunten + concrete aanbevelingen. Leadgeneratie-tool.

**Kennisbank** — ${HOSTNAME}/kennisbank
Overzicht van alle kennisbankartikelen over AI voor het MKB. Gefilterd op categorie: AI Automatisering, MKB Praktijkcases, Implementatietips, AI Tools & Technologie.

---`
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

export async function generateLlmsFullTxt(outDir: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  let articles: BlogPost[] = []

  try {
    const slugs = await getSlugsFromS3()
    const results = await Promise.all(slugs.map((slug) => fetchArticle(slug)))
    articles = results.filter((a): a is BlogPost => a !== null)
    console.log(`[llms-full] ${articles.length}/${slugs.length} artikelen opgehaald uit S3`)
  } catch (err) {
    console.warn('[llms-full] S3 ophalen mislukt — statische header wordt geschreven zonder artikelen:', err)
  }

  const content = [
    buildStaticHeader(today),
    ``,
    buildArticleSection(articles),
    ``,
    `## Contact`,
    ``,
    `- **Website:** ${HOSTNAME}`,
    `- **E-mail:** info@aintern.nl`,
    `- **Kennisbank:** ${HOSTNAME}/kennisbank`,
    `- **Sitemap:** ${HOSTNAME}/sitemap.xml`,
    `- **llms.txt:** ${HOSTNAME}/llms.txt`,
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
