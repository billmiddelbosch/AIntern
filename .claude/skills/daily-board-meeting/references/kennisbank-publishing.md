# Kennisbank Publishing — S3 Workflow

## S3 Bucket
`aintern-kennisbank` (region: eu-west-2)

## Post File Format (`posts/{slug}.json`)

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

## Index File Format (`index.json`)

Holds only summary fields — no `content`. Prepend new posts so newest is first.

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

## Publish Steps

1. Write the article (Dutch, HTML content, 400–700 words)
2. Save post JSON to `/tmp/{slug}.json` (use `C:/Users/bmidd/AppData/Local/Temp/{slug}.json` on Windows)
3. Fetch current index:
   ```bash
   aws s3 cp s3://aintern-kennisbank/index.json /tmp/kennisbank-index.json
   ```
4. Prepend new post summary to `posts` array in the index file
5. Upload post:
   ```bash
   aws s3 cp /tmp/{slug}.json s3://aintern-kennisbank/posts/{slug}.json --content-type application/json
   ```
6. Upload updated index:
   ```bash
   aws s3 cp /tmp/kennisbank-index.json s3://aintern-kennisbank/index.json --content-type application/json
   ```

## Valid Categories

| Category | Colour on site |
|----------|---------------|
| `AI Automatisering` | Blue |
| `MKB Praktijkcases` | Green |
| `Implementatietips` | Orange |
| `AI Tools & Technologie` | Purple |
| `Automatisering` | Grey (fallback) |

## Article Writing Standards

- **Language:** Dutch
- **Length:** 400–700 words
- **Format:** HTML (`<p>`, `<h2>`, `<ul>`, `<li>`, `<strong>`)
- **Tone:** Direct, plain, no buzzwords. Lead with the reader's pain.
- **Metrics:** Always include a real number (e.g. "60 minuten per product → 5 minuten")
- **CTA:** Soft close — "Benieuwd wat dit voor jouw webshop betekent? Plan een gratis gesprek."

## Slug Convention

- Lowercase, hyphen-separated Dutch words
- Max ~60 characters
- Example: `ai-product-invoer-lightspeed-webshop`

## Notes

- No code deploy needed — S3 PUT is sufficient
- `VITE_KENNISBANK_BASE_URL` is a Vite build-time variable in Amplify — changes appear after next build
- Use AppData/Local/Temp/ for temp files on Windows, never write to the git repo
