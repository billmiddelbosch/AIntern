# Kennisbank / Blog — Specification

## Backlog ID
L-11

## Atomic Level
FEATURE (meerdere routes + componenten)

## Overview
De AIntern Kennisbank is een AI-gedreven blogplatform voor praktische kennis over AI voor het MKB. Artikelen worden gegenereerd door Claude- of NotebookLM-agents en als JSON opgeslagen in AWS S3 — publiceren vereist geen code-deploy en geen git-push. De Kennisbank bestaat uit drie onderdelen: een teaser-sectie op de homepage, een overzichtspagina, en een detailpagina per artikel.

## Problem Being Solved
AIntern wil expertise uitdragen en organisch SEO-verkeer genereren zonder dat elke nieuwe blogpost een developer vereist. Het publiceerproces moet volledig door een AI-agent afgehandeld kunnen worden: genereer tekst, schrijf JSON naar S3, klaar.

## User Stories
- Als bezoeker wil ik op de homepage de laatste kennisbank-artikelen zien zodat ik direct relevante inhoud ontdek.
- Als bezoeker wil ik een volledig overzicht van alle artikelen kunnen bekijken en filteren op categorie.
- Als bezoeker wil ik een volledig artikel kunnen lezen op een eigen pagina met SEO-metadata.
- Als content-beheerder (of AI-agent) wil ik een nieuw artikel kunnen publiceren door een JSON-bestand naar S3 te uploaden, zonder enige code-deploy.

## Content Pipeline
1. Claude- of NotebookLM-agent genereert blogtekst + metadata
2. Agent schrijft twee bestanden naar AWS S3:
   - `posts/<slug>.json` — volledig artikel
   - `index.json` — bijgewerkte lijst van alle artikelen (title, slug, date, category, excerpt, metaDescription)
3. Vue haalt `index.json` op bij het laden van de overzichtspagina
4. Vue haalt `posts/<slug>.json` op bij het laden van de detailpagina
5. Geen deploy, geen git-push vereist

## S3 Content Schema

### `index.json`
```json
{
  "posts": [
    {
      "slug": "ai-voor-mkb-stap-voor-stap",
      "title": "AI voor het MKB: stap voor stap",
      "category": "AI Automatisering",
      "publishedAt": "2026-03-31",
      "excerpt": "Hoe begin je als MKB-bedrijf met AI zonder grote investering?",
      "metaDescription": "Praktische gids voor AI-implementatie in het MKB. Geen technische kennis vereist."
    }
  ]
}
```

### `posts/<slug>.json`
```json
{
  "slug": "ai-voor-mkb-stap-voor-stap",
  "title": "AI voor het MKB: stap voor stap",
  "category": "AI Automatisering",
  "publishedAt": "2026-03-31",
  "excerpt": "Hoe begin je als MKB-bedrijf met AI zonder grote investering?",
  "metaDescription": "Praktische gids voor AI-implementatie in het MKB. Geen technische kennis vereist.",
  "content": "<p>...</p>"
}
```

> `content` is HTML-string gegenereerd door de AI-agent. Vue rendert dit via `v-html` in de detailpagina.

## Site-structuur

```
/                          ← Homepage, bevat KennisbankTeaserSection
/kennisbank                ← Overzichtspagina (alle artikelen, filterbaar op categorie)
/kennisbank/:slug          ← Detailpagina per artikel
```

## Acceptance Criteria

### Homepage teaser
- [ ] Toont de laatste 3 artikelen uit `index.json`
- [ ] Elke kaart toont: categorie-tag, titel, excerpt, publicatiedatum, "Lees meer" link → `/kennisbank/:slug`
- [ ] "Bekijk alle artikelen" CTA → `/kennisbank`
- [ ] Sectie heeft `id="kennisbank"` voor anchor-navigatie
- [ ] Loading state tijdens fetch; graceful empty state als S3 niet bereikbaar is

### Overzichtspagina `/kennisbank`
- [ ] Toont alle artikelen uit `index.json` in een grid (3 kolommen desktop, 2 tablet, 1 mobiel)
- [ ] Filterbaar op categorie (client-side filtering)
- [ ] Elke kaart toont: categorie-tag, titel, excerpt, publicatiedatum
- [ ] Pagina heeft eigen SEO meta title + description
- [ ] Loading state + empty state

### Detailpagina `/kennisbank/:slug`
- [ ] Haalt `posts/<slug>.json` op uit S3
- [ ] Rendert `content` als HTML via `v-html`
- [ ] Toont: titel, categorie-tag, publicatiedatum, artikel-body
- [ ] Eigen SEO: `<title>`, meta description, Open Graph tags (title, description) per artikel
- [ ] 404-afhandeling als slug niet bestaat in S3
- [ ] "← Terug naar Kennisbank" navigatielink

### Algemeen
- [ ] Content wordt opgehaald via Axios composable (`useKennisbank.ts`)
- [ ] S3 bucket URL configureerbaar via `VITE_KENNISBANK_BASE_URL` env var
- [ ] Tweetalig: UI-labels (navigatie, "Lees meer", datumformaat) via vue-i18n; artikelcontent is NL (door AI gegenereerd)
- [ ] Router-entries toegevoegd aan `src/router/index.ts`

## Component Tree

```
HomeView.vue
└── KennisbankTeaserSection.vue          [ORGANISM — components/sections/kennisbank/]
    └── BlogCard.vue                     [MOLECULE — components/sections/kennisbank/]

KennisbankView.vue                       [PAGE — views/]
└── BlogCard.vue                         [hergebruikt]

KennisbankArtikelView.vue                [PAGE — views/]
└── ArtikelDetail.vue                    [ORGANISM — components/kennisbank/]
```

## Composables
- `src/composables/useKennisbank.ts` — fetcht `index.json` en individuele post-bestanden uit S3

## Environment Variables
| Var | Voorbeeld | Beschrijving |
|---|---|---|
| `VITE_KENNISBANK_BASE_URL` | `https://aintern-kennisbank.s3.eu-west-2.amazonaws.com` | S3 bucket base URL |

## Categories (initieel)
- AI Automatisering
- MKB Praktijkcases
- Implementatietips
- AI Tools & Technologie

## UI Requirements
- Kaart: witte achtergrond, lichte border, zachte schaduw, hover lift — consistent met ResultaatCard
- Categorie-tag: pill-badge, kleurcodering per categorie
- Datum: geformatteerd als "31 maart 2026" (NL) / "March 31, 2026" (EN) via Intl.DateTimeFormat
- Detailpagina: max-width 65ch voor leesbaarheid, generous line-height

## Implementation Notes
- `v-html` op artikel-content: content komt uitsluitend van eigen AI-agents via eigen S3 bucket — XSS-risico is acceptabel in deze context, maar noteer dit expliciet in de code
- S3 bucket moet CORS toestaan voor het AIntern domein
- `index.json` wordt gesorteerd op `publishedAt` descending door de agent die het schrijft

## Infrastructure
CDK stack: `infra/lib/kennisbank-stack.ts` — `AInternKennisbankStack`
Deploy: `cd infra && npm install && npm run deploy`
Stack output `BucketUrl` → waarde voor `VITE_KENNISBANK_BASE_URL`

## Implemented Files

| File | Atomic Level | Notes |
|---|---|---|
| `src/types/kennisbank.ts` | — | `BlogPostSummary`, `BlogPost`, `KennisbankIndex` interfaces |
| `src/composables/useKennisbank.ts` | — | `fetchIndex()` + `fetchPost(slug)` via dedicated s3Client (no auth headers) |
| `src/components/sections/kennisbank/BlogCard.vue` | MOLECULE | Category pill, title, excerpt, date, RouterLink → `/kennisbank/:slug` |
| `src/components/sections/kennisbank/KennisbankTeaserSection.vue` | ORGANISM | Fetches last 3 posts; loading skeleton, error + empty states; id="kennisbank"; "Bekijk alle artikelen" CTA |
| `src/views/KennisbankView.vue` | PAGE | All posts, client-side category filter, 3/2/1 grid, SEO meta via useUnhead |
| `src/views/KennisbankArtikelView.vue` | PAGE | Fetches single post, v-html body, SEO meta per article, 404 handling, back link |
| `src/router/index.ts` | — | Routes `/kennisbank` and `/kennisbank/:slug` added as lazy imports |
| `src/locales/en.json` | — | All `kennisbank.*` and `nav.kennisbank` keys added |
| `src/locales/nl.json` | — | All `kennisbank.*` and `nav.kennisbank` keys added |
| `src/components/shell/MainNav.vue` | — | "Kennisbank" RouterLink added to desktop + mobile nav |
| `src/components/shell/AppFooter.vue` | — | "Kennisbank" RouterLink added to footer nav |
| `src/views/HomeView.vue` | — | `KennisbankTeaserSection` inserted before `OverAInternContactSectionView` |

## Status
- [x] Spec goedgekeurd
- [ ] Design goedgekeurd
- [x] Implementatie gestart
- [ ] Getest
- [ ] Live

## Changelog
| Datum | Wijziging |
|---|---|
| 2026-03-31 | Initiële spec aangemaakt na vision-sessie (L-11) |
| 2026-03-31 | Volledige implementatie: types, composable, BlogCard, KennisbankTeaserSection, KennisbankView, KennisbankArtikelView, router, i18n, nav, HomeView |
