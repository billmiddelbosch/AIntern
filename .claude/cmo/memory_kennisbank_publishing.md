---
name: Kennisbank Article Publishing
description: How to write and publish a new kennisbank article to the AIntern website via S3
type: reference
---

Articles are published by uploading JSON files to the `aintern-kennisbank` S3 bucket (eu-west-2). No code deploy needed — a PUT to S3 is sufficient.

## Post file format (`posts/{slug}.json`)
```json
{
  "slug": "artikel-slug",
  "title": "Artikel Titel",
  "category": "Automatisering",
  "publishedAt": "YYYY-MM-DD",
  "excerpt": "1–2 sentence excerpt shown on the listing page.",
  "metaDescription": "SEO meta description, under 160 chars.",
  "content": "<p>HTML content here...</p>"
}
```

## Index file format (`index.json`)
The index holds only `BlogPostSummary` fields — no `content`. Prepend new posts so newest is first.
```json
{
  "posts": [
    {
      "slug": "...",
      "title": "...",
      "category": "...",
      "publishedAt": "...",
      "excerpt": "...",
      "metaDescription": "..."
    }
  ]
}
```

## Publish steps
1. Write the article (Dutch, HTML content, 400–700 words)
2. Save post JSON to `/tmp/{slug}.json`
3. Fetch current index: `aws s3 cp s3://aintern-kennisbank/index.json /tmp/kennisbank-index.json`
4. Prepend new post summary to `posts` array in the index file
5. Upload post: `aws s3 cp /tmp/{slug}.json s3://aintern-kennisbank/posts/{slug}.json --content-type application/json`
6. Upload updated index: `aws s3 cp /tmp/kennisbank-index.json s3://aintern-kennisbank/index.json --content-type application/json`

## Valid categories (colour-coded on the site)
- `AI Automatisering`
- `MKB Praktijkcases`
- `Implementatietips`
- `AI Tools & Technologie`
- `Automatisering` (fallback, grey)

## Notes
- `VITE_KENNISBANK_BASE_URL` must be set in Amplify environment variables and a new build triggered before changes appear on aintern.nl — this is a Vite build-time variable.
- Content topics that resonate: time savings, Lightspeed integrations, AI for repetitive tasks, case studies with real metrics (60 min → 5 min).

## SEO Schrijfregels (verplicht per artikel — board 2026-04-26)

### Title
- Maximaal 60 tekens
- Primair keyword vooraan (eerste 30 tekens)
- Formaat: `[Keyword] — [belofte/resultaat]` of `Hoe [keyword] jouw MKB [resultaat]`

### Meta description (veld `metaDescription`)
- 120–155 tekens
- Structuur: **probleem** + **oplossing** + **resultaat**
- 1 hoofdkeyword verwerkt
- Voorbeeld: "Veel MKB-bedrijven worstelen met handmatige productinvoer. AI automatiseert dit proces — en bespaart 50+ uur per maand."

### Artikel H1/H2 structuur (verplicht)
1. **H1** — hoofdonderwerp met keyword
2. **Intro** (geen header) — probleem + herkenning bij MKB-lezer
3. **H2** — Waarom dit probleem groeit
4. **H2** — De oplossing met AI
5. **H2** — Praktijkvoorbeeld MKB (concreet, met cijfers)
6. **H2** — Eerste stap die je vandaag kunt zetten

### Interne linking (verplicht)
- Voeg 2–3 interne links per artikel toe
- Gebruik keyword als anchor text (niet "klik hier")
- Link bij voorkeur naar gerelateerde Kennisbank artikelen + homepage CTA

### Content clusters (voorkom keyword cannibalization)
Schrijf per cluster, niet door elkaar:
1. **AI automatisering MKB** — procesautomatisering, tijdsbesparing, schaalbaarheid
2. **AI webshop optimalisatie** — Lightspeed, productinvoer, voorraadbeheer, klantenservice
3. **Proces automatisering** — workflows, herhaalbare taken, no-code/low-code AI tools
