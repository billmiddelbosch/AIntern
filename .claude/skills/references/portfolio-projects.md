# Portfolio Projects — Reference

Delivered client projects that can be used as portfolio case studies on the AIntern homepage.

## ITGuru

**Repo:** `C:/Users/bmidd/development/ITGuru`
**Public name:** "IT-reseller in de regio" (client not named publicly)
**Category:** AI procurement automation

**What was built:**
- AI-assisted product lookup (Icecat + Tweakers scraper + Claude Haiku fallback)
- Lightspeed webshop integration (bulk product push via API)
- Purchasing advice engine: automated margin calculation + buy/no-buy signal
- Pipeline orchestration: S3-triggered Lambda, DynamoDB, SES mail-parser
- Vue 3 admin dashboard (run overview, product table, threshold config)

**Key stats:**
- 300 products processed per batch in ~13 minutes
- Fully automated: supplier Excel → enriched data → Lightspeed

**Tech stack:** Vue 3, TypeScript, AWS Lambda, DynamoDB, S3, SES, Claude AI (Haiku), Lightspeed API, Icecat, Tweakers scraper

**Portfolio component:** `src/components/sections/portfolio/PortfolioSection.vue`
**i18n keys:** `portfolio.*` in `src/locales/nl.json` + `en.json`
