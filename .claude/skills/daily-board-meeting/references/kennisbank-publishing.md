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
3. **Index integrity check** — Before touching the index, verify it is in sync with S3:
   ```bash
   S3_COUNT=$(aws s3 ls s3://aintern-kennisbank/posts/ --region eu-west-1 | grep -c '\.json$')
   aws s3 cp s3://aintern-kennisbank/index.json /tmp/kennisbank-index.json --region eu-west-1
   INDEX_COUNT=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.env.TEMP+'/kennisbank-index.json','utf8')); console.log(i.posts.length);")
   echo "S3 posts: $S3_COUNT | Index entries: $INDEX_COUNT"
   ```
   If `S3_COUNT > INDEX_COUNT`: the index is stale. **Do not prepend to the stale index.** Instead, rebuild the full index by fetching every post file from S3 (see Rebuild Index below), then prepend the new article to the rebuilt index. Uploading a partial index overwrites correct data with corrupt data. **Rootcause:** On 2026-04-27 index had 4 entries while 11 posts existed — the prepend-to-stale approach produced a 5-article index, wiping 7 articles.
4. Prepend new post summary to `posts` array in the index file (only if integrity check passed or rebuild is complete)
5. Upload post:
   ```bash
   aws s3 cp "$TEMP/{slug}.json" s3://aintern-kennisbank/posts/{slug}.json --content-type application/json --region eu-west-1
   ```
6. Upload updated index:
   ```bash
   aws s3 cp "$TEMP/kennisbank-index.json" s3://aintern-kennisbank/index.json --content-type application/json --region eu-west-1
   ```
7. **Trigger Amplify build** — refresh `sitemap.xml` / `llms-full.txt` via the same webhook mechanism as NewsFlow (`lambda/src/lib/amplify-webhook.ts`, called non-fatally by `contentbuilder.ts`/`seooptimizer.ts`). The build regenerates both files at build-time from the public S3 indexes (`scripts/generate-sitemap.ts` / `scripts/generate-llms-full.ts` — both already read the Kennisbank *and* NewsFlow index):
   ```bash
   WEBHOOK_URL=$(MSYS_NO_PATHCONV=1 aws ssm get-parameter --name "/aintern/prod/amplify/build-webhook-url" --with-decryption --region eu-west-2 --query "Parameter.Value" --output text)
   curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' "$WEBHOOK_URL"
   ```
   Use alias `prod` — the Kennisbank content bucket is not environment-split (one bucket, live site). Expect HTTP `200`. On any other status code, or an empty `$WEBHOOK_URL`: treat it as **non-fatal** — the article itself is already published via steps 5–6 above — and surface `[BLOCKER: Amplify build trigger mislukt — sitemap/llms blijven stale tot de volgende deploy]`. **Never log the webhook URL** — it embeds a secret token.

## Rebuild Index (when stale)

Fetch all posts and reconstruct index from scratch:
```bash
# 1. Download all posts
aws s3 ls s3://aintern-kennisbank/posts/ --region eu-west-1 | awk '{print $4}' | grep '\.json$' | while read f; do
  aws s3 cp "s3://aintern-kennisbank/posts/$f" "$TEMP/$f" --region eu-west-1
done
# 2. Rebuild index in Node
node -e "
const fs=require('fs'),tmpDir=process.env.TEMP;
const files=fs.readdirSync(tmpDir).filter(f=>f.endsWith('.json')&&!f.startsWith('kennisbank-index'));
const posts=files.map(f=>{const d=JSON.parse(fs.readFileSync(tmpDir+'/'+f,'utf8'));return{slug:d.slug,title:d.title,excerpt:d.excerpt||'',category:d.category,publishedAt:d.publishedAt};});
posts.sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
fs.writeFileSync(tmpDir+'/kennisbank-index.json',JSON.stringify({posts},null,2));
console.log('Rebuilt: '+posts.length+' artikelen');
"
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
- **Length:** 500–800 words (400–700 base article + FAQ section below)
- **Format:** HTML (`<p>`, `<h2>`, `<ul>`, `<li>`, `<strong>`)
- **Tone:** Direct, plain, no buzzwords. Lead with the reader's pain.
- **Metrics:** Always include a real number (e.g. "60 minuten per product → 5 minuten")
- **FAQ / klantvragen sectie (verplicht):** Zelfde patroon als NewsFlow (`lambda/src/newsanalyzer.ts` → `contentbuilder.ts`: lezersvragen extraheren, dan als FAQ verwerken). Identificeer 2–3 concrete vragen die een MKB/Lightspeed-webshopeigenaar zou stellen over het onderwerp, en beantwoord elk in max 80 woorden. NewsFlow gebruikt een apart `faq`-datamodel-veld gerenderd als `<dl>/<dt>/<dd>`; Kennisbank-posts zijn één HTML-string, dus embed het direct in `content` aan het eind van het artikel (vóór de CTA), met alleen toegestane tags:
  ```html
  <h2>Veelgestelde vragen</h2>
  <p><strong>Vraag 1?</strong> Antwoord in max 80 woorden.</p>
  <p><strong>Vraag 2?</strong> Antwoord in max 80 woorden.</p>
  ```
- **CTA:** Soft close — "Benieuwd wat dit voor jouw webshop betekent? Plan een gratis gesprek." (komt na de FAQ-sectie)

## Slug Convention

- Lowercase, hyphen-separated Dutch words
- Max ~60 characters
- Example: `ai-product-invoer-lightspeed-webshop`

## Notes

- Sitemap/llms refresh is automatic via the Amplify build webhook (Publish Step 7) — same mechanism as NewsFlow; don't skip that step
- `VITE_KENNISBANK_BASE_URL` is a Vite build-time variable in Amplify — changes appear after next build
- Use AppData/Local/Temp/ for temp files on Windows, never write to the git repo
