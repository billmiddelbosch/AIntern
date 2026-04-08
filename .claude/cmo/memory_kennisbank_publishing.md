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
