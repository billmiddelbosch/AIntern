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
