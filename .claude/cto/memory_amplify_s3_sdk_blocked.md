---
name: Amplify build S3 SDK verboden
description: Amplify build-rol mist s3:ListBucket — gebruik HTTP fetch van publieke S3 URLs in build scripts, niet AWS SDK
metadata:
  type: feedback
---

Gebruik in Vite build plugins en build-time scripts (`scripts/*.ts`) **nooit** `@aws-sdk/client-s3` voor `ListObjectsV2Command` of `GetObjectCommand`.

**Why:** De Amplify build IAM-rol heeft geen `s3:ListBucket` of `s3:GetObject` rechten. De SDK faalt stil (try/catch vangt de exception) en de output is leeg — `llms-full.txt` werd gegenereerd zonder artikelen. Root cause gevonden 2026-05-19 (B-106).

**How to apply:** Vervang S3 SDK calls in build scripts altijd door HTTP `fetch()` van publieke S3 URLs:
- Index: `https://aintern-kennisbank.s3.eu-west-2.amazonaws.com/index.json`
- Artikel: `https://aintern-kennisbank.s3.eu-west-2.amazonaws.com/posts/{slug}.json`

AWS SDK blijft correct voor Lambda handlers (die draaien runtime met eigen IAM-rol, niet tijdens Amplify build).
