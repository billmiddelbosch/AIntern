# Security Check — Week 16 (2026-04-16)

## Status: PASS WITH WARNINGS

## Bevindingen

### Kritiek (blokkeer deploy)
- Geen

### Hoog (oplossen binnen 1 sprint)
- **[npm] vite <=6.4.1 — HIGH** (GHSA-4w7w-66w2-5vf9, GHSA-p9ff-h696-f583): Path Traversal in Optimized Deps `.map` + Arbitrary File Read via dev server WebSocket. Fix: `npm audit fix`. Dev-only risk (niet in prod build), maar upgrade vereist.
- **[Lambda] `calendly-webhook.ts` + `intake.ts` gebruiken hardcoded `Access-Control-Allow-Origin: *`** in plaats van het verplichte `corsOrigin()` + `respond()` patroon (CLAUDE.md conventie). Beide handlers moeten worden aangepast.

### Laag / informatief
- **[npm] axios 1.0.0–1.14.0 — MODERATE** (GHSA-3p68-rc4w-qgx5, GHSA-fvcv-3m26-pcqx): NO_PROXY bypass (SSRF) + header injection chain.
- **[npm] follow-redirects <=1.15.11 — MODERATE** (GHSA-r4q5-vmmm-2653): Auth header leak naar cross-domain redirects.
- **[npm] unhead <2.1.13 — MODERATE** (GHSA-95h2-gj7x-gx9w): hasDangerousProtocol() bypass via leading-zero HTML entities.
- **[Frontend] v-html met CMS-content** in `KennisbankArtikelView.vue:190` (post.content direct in v-html via eslint-disable). XSS-risico als S3-inhoud niet gesaniteerd is. Aanbeveling: DOMPurify toevoegen.
- **[Frontend] v-html voor icons** in `ResultaatCard.vue:46`, `ProbleemOplossingCard.vue:30`, `HowItWorksSection.vue:58`. Laag risico (interne data via getIcon()).
- **[Secrets] .env bevat APIFY_TOKEN** — correct gitignored (.env + .env.* in .gitignore). Geen secret in git history.

## Gecontroleerde categorieën
- [x] Secrets & credentials
- [x] npm audit
- [x] Lambda CORS/input validatie
- [x] Frontend XSS (v-html)
- [x] Auth guard /admin

## Acties vereist
1. `npm audit fix` uitvoeren — 6 vulnerabilities (1 high, 5 moderate)
2. `lambda/src/calendly-webhook.ts` refactoren naar corsOrigin() + respond() patroon
3. `lambda/src/intake.ts` refactoren naar corsOrigin() + respond() patroon
4. Overweeg DOMPurify voor post.content in KennisbankArtikelView.vue (laag prioriteit)