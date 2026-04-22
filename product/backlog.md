# Product Backlog — AIntern

## Landing Page (L)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| ~~L-02~~ | ~~**Problemen & Oplossingen**~~ | M | ~~Drie MKB-pijnpunten vertaald naar concrete AI-aanpak van AIntern. Roadmap section 3.~~ Geïmplementeerd 2026-03-25. |
| ~~L-03~~ | ~~**Resultaten & Cases**~~ | M | ~~Kwantificeerbare voorbeelden van tijds- en kostenbesparing door AI-inzet. Roadmap section 4.~~ Geimplementeerd 2026-03-25. |
| ~~L-04~~ | ~~**No-Cure-No-Pay & FAQ**~~ | M | ~~Risicovrij businessmodel uitgelegd met veelgestelde bezwaren proactief weggenomen. Roadmap section 5.~~ In progress 2026-03-25. |
| ~~L-05~~ | ~~**Over AIntern & Contact**~~ | S | ~~Verhaal, visie en CTA om een vrijblijvend kennismakingsgesprek in te plannen. Roadmap section 6.~~ Geimplementeerd 2026-03-31. |
| ~~L-06~~ | ~~**SEO & Meta Tags**~~ | S | ~~Page title, meta description, Open Graph tags, and canonical URLs for all routes.~~ Geimplementeerd 2026-03-30. |
| ~~L-07~~ | ~~**Analytics Integration**~~ | S | ~~Google Analytics or Plausible integration; track page views and CTA clicks.~~ Geimplementeerd 2026-03-30. |
| ~~L-08~~ | ~~**Contact Form / Calendly Booking Widget**~~ | M | ~~Embedded Calendly widget or custom form to schedule a no-obligation intro call.~~ Geimplementeerd 2026-03-28. |
| ~~L-09~~ | ~~**Cookie Consent Banner (GDPR)**~~ | S | ~~Consent banner required before loading analytics; stores preference in localStorage.~~ Geimplementeerd 2026-03-30. |
| ~~L-14~~ | ~~**Marketing Alignment — Website verbeteringen obv go-to-market strategie**~~ | M | ~~5 verbeteringen gebaseerd op GTM-sessie 2026-04-01. Spec: `product/sections/marketing-alignment/spec.md`. Stap 1 ✅ de4ef63. Stap 2 ✅ de4ef63. Stap 3 ✅ B-14. Stap 4 ✅ B-16. Stap 5 ✅.~~ Alle 5 stappen geïmplementeerd — bevestigd gereed door Human Board 2026-04-17. |
| L-10 | **Social Proof / Testimonials Section** | M | Client quotes or logos to build trust. Ties into Resultaten & Cases narrative. **Lage prioriteit — Human Board 2026-04-20.** |
| ~~L-11~~ | ~~**Blog / Kennisbank stub**~~ | M | ~~Placeholder section or route for future knowledge-base articles; improves SEO.~~ Geïmplementeerd 2026-04-02. |
| L-12 | **AI Interaction Panel** | L | Direct in-page interaction with the AI intern — chat interface or task demo widget. |
| L-13 | **Animations of Previous Assignments / Portfolio** | M | Animated showcase of past AI-intern work; visual portfolio to demonstrate capability. |

## Bugs (BUG)

| ID | Bug | Effort | Notes |
|---|---|---|---|
| BUG-01 | **Kennisbank navigatie — top en footer werken niet terug naar hoofdpagina** | S | Top- en footer-navigatielinks in de Kennisbank verwijzen niet correct terug naar de single-page app. Gebruiker zit vast in Kennisbank zonder terugweg. Onderzoek Vue Router link targets en of de Kennisbank route een aparte layout gebruikt die de globale nav overschrijft. |
| BUG-04 | **Sitemap.xml mist alle Kennisbank-artikel-routes** | S | `public/sitemap.xml` wordt alleen gegenereerd tijdens `npm run build` via een Vite-plugin die S3 uitvraagt. Artikelen die ná de laatste build naar S3 zijn gepubliceerd verschijnen niet in de sitemap — slecht voor SEO-indexering van die pagina's. Mogelijk verergerd door "Fix build error" commits 2026-04-16. Fix: (1) vergelijk S3-slugs met sitemap.xml en identificeer ontbrekende routes; (2) voeg sitemap-regeneratie toe aan het artikel-publish-script zodat de sitemap altijd actueel is na publicatie. Gemeldt door Human Board 2026-04-17. |
| BUG-02 | **Over AIntern — e-mailoptie werkt niet** | S | De contactoptie via e-mail in de Over AIntern sectie reageert niet. Controleer mailto-link, event handler, en of de knop correct is gekoppeld. |
| BUG-03 | **Calendly vervangen door eigen boekingscomponent** | L | De huidige Calendly-widget vervangen door eigen implementatie met vergelijkbare functionaliteit (tijdslot selectie, bevestiging, integratie met bestaande intake-flow). Zie ook I-04 en I-05 voor gerelateerde serverless backend en e-mail collectie. |

## UX & Accessibility (U)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| U-01 | **Skip-to-content & ARIA Landmarks** | S | Accessibility baseline: skip link and proper landmark roles across all pages. |
| U-02 | **Mobile Navigation / Hamburger Menu** | S | Responsive nav for small screens; animated open/close using VueUse. |
| U-03 | **Scroll-triggered Entrance Animations (VueUse)** | S | Fade/slide-in on scroll using useIntersectionObserver from VueUse. |
| U-04 | **Animated IAgent Brand Icon** | S | Introduce an animated version of the IAgent brand icon for hero or navbar use. |

## Technical & Infrastructure (I)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| ~~I-03~~ | ~~**Sitemap & robots.txt**~~ | S | ~~Static sitemap.xml and robots.txt for crawler discoverability; pairs with L-06 SEO work.~~ Geïmplementeerd 2026-04-02. |
| I-04 | **Serverless Contact Form Backend** | M | Replace Formspree with a serverless function (e.g. Vercel/Netlify function) that sends email server-side. Destination email stored in a server-only env var — never exposed to the client bundle. Current Formspree setup is the temporary solution. |
| I-05 | **Collect real email address in intake flow** | S | Email was removed from the 5-step intake form but the Lambda still requires it (currently using a dummy value `test@aintern.nl`). Add email collection back — either as a step in the intake modal or derive it from the Calendly webhook after booking. Required for DynamoDB GSI lookup and meeting confirmation. |

## SEO (S)

| ID | Feature | Effort | Prio | Notes |
|---|---|---|---|---|
| S-01 | **Dynamische sitemap.xml generatie** | S | P1 | robots.txt verwijst naar sitemap.xml maar het bestand bestaat niet. Genereer bij build-tijd een sitemap die `/`, `/kennisbank`, en alle Kennisbank-artikelroutes bevat via een Vite-plugin of build-script dat de S3 index ophaalt. Pairs with I-03. |
| S-02 | **OG / Twitter Card meta-tags homepage** | S | P1 | `index.html` mist `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`. Voeg toe via `@unhead/vue` in een globale `useHead()` composable — inclusief verwijzing naar de bestaande `public/og-image.png`. Alle social shares winnen direct beeld + context. |
| S-03 | **Article + BreadcrumbList schema.org op Kennisbank-artikelpagina's** | S | P1 | `KennisbankArtikelView.vue` heeft geen structured data. Voeg `@type: Article` (headline, author, datePublished, image, url) en `@type: BreadcrumbList` toe via `useUnhead`. Google News eligibility en rich results vereisen dit. |
| S-04 | **FAQ schema.org op NoCureNoPayFaq sectie** | S | P2 | Voeg `@type: FAQPage` structured data toe aan de NoCureNoPayFaq sectie. FAQ-items als `Question`/`Answer` pairs in JSON-LD. Maakt rich snippets mogelijk op high-intent zoektermen als "no-cure-no-pay AI MKB". |
| S-05 | **Pre-rendering SPA voor SEO (vite-plugin-prerender)** | M | P1 | De Vue SPA rendert client-side — Google-crawlers zien een blanco `<div id="app">`. Installeer `vite-plugin-prerender` en pre-render bij build: `/`, `/kennisbank`, en alle actieve artikelroutes (ophalen uit S3 index). Structurele fix voor alle SEO-investeringen. |
| S-06 | **Interne linking: Kennisbank-artikelen → Homepage CTA + breadcrumbs** | S | P2 | Elke Kennisbank-artikelpagina moet (1) een breadcrumb tonen (Home → Kennisbank → Artikel), (2) een CTA-blok bevatten dat teruglinkt naar de homepage intake-flow. Verhoogt dwell time, crawldiepte en conversie vanuit organisch traffic. |
| S-07 | **Image alt-tekst audit + correcties** | S | P2 | Audit alle `<img>` tags in `src/` op ontbrekende of lege `alt`-attributen. Herstel alle gevallen. Prioriteit op hero-afbeelding, Kennisbank og-image, en illustraties in sectieviews. Accessibility + image search indexering. |
| S-08 | ~~**SEO keyword-analyse + optimalisatiefundament**~~ | M | P1 | ~~Voer een volledige keyword-analyse uit voor aintern.nl vóór verdere SEO-implementaties.~~ Geïmplementeerd 2026-04-16 — `product/seo/keyword-strategy.md` aangemaakt (B-18). |
| S-09 | **Search Console koppeling — traffic data per Kennisbank-artikel** | M | P2 | Toon clicks, impressies en gemiddelde Google-positie per artikel in `/admin/kennisbank` (listview + edit form). Vereist: Google Search Console API (OAuth, free), nieuwe Lambda endpoint die GSC data ophaalt per URL, kolommen in `KennisbankListView`. Goedgekeurd als vervolg op A-05 in-form SEO-indicatoren — Human Board 2026-04-17. Depends on A-05. Stappen: (1) Identificeer primaire zoektermen (bijv. "AI stagiaire MKB", "AI automatisering MKB", "no-cure-no-pay AI") en long-tail varianten; (2) Analyseer zoekvolume + concurrentie via Google Search Console, Ubersuggest of SEMrush; (3) Map keywords op bestaande pagina's en secties (homepage, Kennisbank, FAQ); (4) Identificeer keyword gaps — onderwerpen waar we niet voor ranken maar wel waarde kunnen leveren; (5) Documenteer aanbevelingen in `product/seo/keyword-strategy.md` als input voor S-01 t/m S-07, Kennisbank-contentplanning, en toekomstige copywriting. Blokkeer geen P1-items — kan parallel lopen. |

## Board Meeting Actions (B)

| ID | Feature | Effort | Owner | Status | Source | Success Metric |
|---|---|---|---|---|---|---|
| ~~B-01~~ | ~~**Wekelijkse security check uitvoeren en documenteren**~~ | S | CTO | ✅ done | board-meeting-2026-04-11 | Commit 6ba7260 — PASS WITH WARNINGS, 3 high findings gedocumenteerd in .claude/cto/memory_security_check_2026-04-11.md |
| ~~B-02~~ | ~~**Lead-CSV verrijken via Apify (LinkedIn URLs voor ≥5 resterende Lightspeed-leads)**~~ | S | CMO | ✅ done | board-meeting-2026-04-12 | Apify credits beschikbaar (FREE plan reset maandelijks — gecorrigeerd 2026-04-17); vervangen door B-31 |
| ~~B-03~~ | ~~**Kennisbank artikel publiceren: MKB AI-implementatiekloof (S3, Dutch, 400–700 woorden)**~~ | S | CMO | ✅ done | board-meeting-2026-04-12 | Gepubliceerd 2026-04-12: s3://aintern-kennisbank/posts/mkb-ai-implementatie-kloof-weten-doen.json |
| ~~B-04~~ | ~~**1 LinkedIn post publiceren over AI voor MKB**~~ | S | CMO | ✅ done | board-meeting-2026-04-12 | Gepubliceerd 2026-04-12: urn:li:share:7449037918192648192 — AIntern company page |
| ~~B-05~~ | ~~**A-03 Role-based access implementeren (role: admin of editor in auth store)**~~ | S | CTO | ❌ gecancelled | board-meeting-2026-04-12 | Gecancelled 2026-04-12 op verzoek Human Board |
| ~~B-06~~ | ~~**Lead pipeline bijwerken: Bram, Jan, Bob op dm_sent status gedocumenteerd**~~ | S | COO | ✅ done | board-meeting-2026-04-12 | Al gedaan: outreach-log.csv had dm_sent voor Bram/Jan/Bob al correct sinds 2026-04-11 |
| ~~B-07~~ | ~~**Apify credits bijvullen (≥ $5)**~~ | S | CEO | ✅ done | board-meeting-2026-04-13 | Apify FREE plan reset maandelijks — geen handmatige actie nodig |
| ~~B-08~~ | ~~**3e LinkedIn post publiceren (AIntern company page)**~~ | S | CMO | ✅ done | board-meeting-2026-04-13 | Gepubliceerd 2026-04-13: urn:li:share:7449412671705219072 — AIntern company page |
| ~~B-09~~ | ~~**A-04 implementeren: Kennisbank article list in /admin**~~ | M | CTO | ✅ done | board-meeting-2026-04-13 | `/admin/kennisbank` route live, sortable paginated table, type-check pass — 9 files, feature/board-2026-04-13 |
| B-10 | **CEO prospect outreach — 1 Lightspeed-prospect contacteren via LinkedIn** | S | CEO | todo | board-meeting-2026-04-13 | ≥1 prospect gecontacteerd, gelogd in pipeline |
| ~~B-12~~ | ~~**A-16 implementeren: /admin/organisation pagina**~~ | S | CTO | ✅ done | board-meeting-2026-04-15 | Route `/admin/organisation` live, agents + hiërarchie zichtbaar — feature/board-2026-04-15 |
| ~~B-13~~ | ~~**Kennisbank artikel: "AI procesautomatisering bereikbaar voor iedere organisatie"**~~ | S | CMO | ✅ done | board-meeting-2026-04-15 | Gepubliceerd 2026-04-15: s3://aintern-kennisbank/posts/ai-procesautomatisering-bereikbaar-voor-mkb.json |
| ~~B-14~~ | ~~**L-14 stap 3: Hero headline Big Idea vervangen (nl.json + en.json)**~~ | S | CTO | ✅ done | board-meeting-2026-04-15 | `hero.headline` + `hero.subtext` bijgewerkt per spec, type-check pass — feature/board-2026-04-15 |
| ~~B-11~~ | ~~**O-01 scope definiëren + eerste draft weekrapport-structuur**~~ | S | COO | ✅ done | board-meeting-2026-04-13 | product/sections/weekly-report/spec.md + template.md aangemaakt — feature/board-2026-04-13 |
| ~~B-15~~ | ~~**O-01 weekly-report skill implementeren**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | `.claude/skills/weekly-report.md` aangemaakt; `weekrapport-2026-W16.md` gegenereerd in Obsidian vault, alle 6 secties gevuld — feature/board-2026-04-16 |
| ~~B-16~~ | ~~**L-14 stap 4: GodfatherOfferSection.vue implementeren**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | GodfatherOfferSection.vue live in HomeView.vue, responsive, i18n in nl.json + en.json, type-check pass — feature/board-2026-04-16 |
| ~~B-17~~ | ~~**Pipeline 2e update week 16 bijwerken**~~ | S | COO | ✅ done | board-meeting-2026-04-16 | outreach-log.csv correct: 3 leads op dm_sent, collegepoint op not_found |
| ~~B-18~~ | ~~**S-08 SEO keyword-analyse + keyword-strategy.md documenteren**~~ | M | CTO | ✅ done | board-meeting-2026-04-16 | `product/seo/keyword-strategy.md` aangemaakt — commit 8380130 |
| ~~B-19~~ | ~~**Wekelijkse security check week 16 uitvoeren en documenteren**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | Security rapport gedocumenteerd in `.claude/cto/` — commit 59b7980 |
| ~~B-20~~ | ~~**S-01 Dynamische sitemap.xml generatie toevoegen**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | Al geïmplementeerd via `vite-ssg-sitemap` in `vite.config.ts` + `includedRoutes` — commit 7c0eeac |
| ~~B-21~~ | ~~**Lambda CORS fix: calendly-webhook.ts + intake.ts naar corsOrigin() patroon**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | Beide handlers gebruiken corsOrigin() + respond() conform CLAUDE.md — commit 7b47c1b |
| ~~B-22~~ | ~~**npm audit fix: vite HIGH + axios/follow-redirects/unhead MODERATE**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | `package.json` override `@unhead/dom >= 2.1.13`; `npm audit` → 0 vulnerabilities |
| ~~B-23~~ | ~~**v-html XSS review in KennisbankArtikelView.vue**~~ | S | CTO | ✅ done | board-meeting-2026-04-16 | DOMPurify geïnstalleerd; `sanitizedContent` computed; `eslint-disable` verwijderd — `KennisbankArtikelView.vue` |
| ~~B-24~~ | ~~**BUG-04: Sitemap.xml fix — Kennisbank artikel-routes ontbreken**~~ | S | CTO | ✅ done | board-meeting-2026-04-17 | sitemap.xml gefixed, sitemap:generate npm script toegevoegd — feature/board-2026-04-17 |
| ~~B-25~~ | ~~**A-05 spec schrijven — article create/edit form**~~ | S | CTO | ✅ done | board-meeting-2026-04-17 | Spec aangemaakt: product/sections/admin-article-form/spec.md — feature/board-2026-04-17 |
| ~~B-26~~ | ~~**O-02 spec schrijven — Lead Pipeline CRM**~~ | S | COO | ✅ done | board-meeting-2026-04-17 | Spec aangemaakt: product/sections/admin-lead-pipeline/spec.md — feature/board-2026-04-17 |
| ~~B-27~~ | ~~**A-18 spec schrijven — Organisatieoverzicht agent-uitbreiding + iconen**~~ | S | CTO | ✅ done | board-meeting-2026-04-17 | Spec aangemaakt: product/sections/admin-organisation/spec.md — feature/board-2026-04-17 |
| ~~B-28~~ | ~~**A-05 implementeren — article create/edit form (TipTap)**~~ | M | CTO | ✅ done | board-meeting-2026-04-18 | Geïmplementeerd commit 25aeded — KennisbankArticleFormView.vue, 3 componenten, composable, Lambda GET/PUT/POST/DELETE, sitemap regeneratie, deletion UI ✅ — backlog-update gemist door build error disruptie |
| ~~B-29~~ | ~~**A-18 implementeren — alle sub-agents + emoji-iconen in AdminOrganisationView.vue**~~ | S | CTO | ✅ done | board-meeting-2026-04-18 | 37 agents (4 C-level + 33 sub-agents), emoji icons, chip-lijst, kaarten per parent — commit 42a2f37 |
| ~~B-30~~ | ~~**Kennisbank artikel publiceren — AI-governance voor MKB**~~ | S | CMO | ✅ done | board-meeting-2026-04-18 | Gepubliceerd 2026-04-18: s3://aintern-kennisbank/posts/waarom-ai-tools-niet-landen-bij-webshops.json |
| B-31 | **Apify lead enrichment — nieuwe Lightspeed-leads ophalen (≥5 URLs)** | S | CMO | todo | board-meeting-2026-04-18 | ≥5 nieuwe leads in outreach-log.csv met LinkedIn URL; enrichment-run gelogd |
| ~~B-32~~ | ~~**L-10 spec schrijven — Social Proof / Testimonials Section**~~ | S | CTO | ✅ done | board-meeting-2026-04-18 | product/sections/social-proof/spec.md aangemaakt — feature/board-2026-04-18 |
| ~~B-33~~ | ~~**RTK installeren + Claude Code hook configureren**~~ | S | CTO | ✅ done | board-meeting-2026-04-19 | RTK geïmplementeerd commit 9dcc05c — CLAUDE.md mode op Windows (hook-mode niet ondersteund); `rtk <cmd>` prefix actief |
| ~~B-34~~ | ~~**Test suite — sitemap availability + correctheid (Vitest)**~~ | S | CTO | ✅ done | board-meeting-2026-04-19 | 8 sitemap tests groen — commit 935c167 |
| ~~B-35~~ | ~~**Test suite — Lambda API endpoints (Vitest integration tests)**~~ | M | CTO | ✅ done | board-meeting-2026-04-19 | 21 Lambda endpoint tests groen (auth, GET list/slug, PUT, POST publish, DELETE, CORS) — commit 935c167; 112 totaal |
| B-36 | **Reddit Hot Topics Detector — Lambda feature** | M | CTO | todo | board-meeting-2026-04-20 | Lambda functie die Reddit API pollt op hot topics per subreddit en resultaten opslaat voor gebruik door CMO/content pipeline. Approved by Human Board. |
| B-37 | **Model usage analysis — right-size Claude models per action** | S | CTO | todo | board-meeting-2026-04-20 | Audit alle Claude API call sites in de codebase en Lambda functies. Bepaal per actie of een frontier model (Sonnet/Opus) nodig is of dat Haiku volstaat zonder kwaliteitsverlies. Deliverable: decision matrix — actie → aanbevolen model → cost/quality rationale. Doel: inference-kosten verlagen met behoud van outputkwaliteit. High priority. |
| ~~B-38~~ | ~~**O-02 fase 1: read-only Lead Pipeline Kanban (/admin/leads)**~~ | M | CTO | ✅ done | board-meeting-2026-04-20 | Route `/admin/leads` live met Kanban-board per status-kolom; leads geladen via Lambda GET /leads (CSV als bron); type-check pass. Fase 1 = read-only (geen drag-and-drop DynamoDB write — dat is fase 2). |
| B-39 | **5 LinkedIn connection requests versturen (week 17 batch 1)** | S | CMO | todo | board-meeting-2026-04-20 | 5 rijen in outreach-log.csv met status `connection_sent` en `connection_sent_at` 2026-04-20: Franny van Soest, Denise Aa, Ilse Huijbregts, Nick van den Berg, Bep Floor. |
| ~~B-40~~ | ~~**Kennisbank artikel publiceren — week 17 artikel 1**~~ | S | CMO | ✅ done | board-meeting-2026-04-20 | Gepubliceerd 2026-04-20: s3://aintern-kennisbank/posts/startup-van-de-toekomst-2-ai-operators.json — seed: "De startup van de toekomst 2 AI operators.md" |
| B-41 | **S-03: Article + BreadcrumbList schema.org op Kennisbank-artikelpagina's** | S | CTO | todo | board-meeting-2026-04-20 | `KennisbankArtikelView.vue` injecteert JSON-LD @type:Article + @type:BreadcrumbList via useHead(); type-check pass. |
| ~~B-42~~ | ~~**Storywriter/copywriter brief + stijlgesprek Human Board**~~ | S | CMO | ✅ done | board-meeting-2026-04-20 | Brief aangemaakt: `.claude/cmo/memory_storywriter_brief.md` — stijlgesprek gevoerd 2026-04-20; "AI-Duo Experiment" serie gedefinieerd, 2×/week (ma/do), ghostwriter zoekt actief stijlreferenties. |
| ~~B-43~~ | ~~**A-19: LinkedIn Posts admin pagina (/admin/linkedin)**~~ | M | CTO | ✅ done | board-meeting-2026-04-20 | Admin pagina voor Bill's persoonlijk LinkedIn posts — zelfde workflow als Kennisbank: draft → review → goedkeuring → publiceren. Posts nooit automatisch publiceren zonder expliciete goedkeuring Human Board. Ghostwriter/AI levert drafts aan in admin UI; Bill keurt goed en past aan. Onderdeel van "AI-Duo Experiment" serie infrastructuur. |
| B-44 | **Ghostwriter activeren — eerste batch LinkedIn posts draften (4 posts)** | S | CMO | todo | board-meeting-2026-04-20 | 4 LinkedIn post-drafts aangeleverd in `.claude/cmo/ghostwriter_drafts/` voor "Het AI-Duo Experiment" serie; startmateriaal: Obsidian seeds "Product developers winnen..." + "Software bouwen is skills en agents bouwen". Bill keurt goed vóór publicatie. Admin UI (B-43) niet vereist voor eerste batch. |

## Organisation (O)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| O-01 | **Weekly Auto-Report** | S | As the CEO, I want a weekly auto-generated internal report summarising pipeline health, active project statuses, and open blockers, so that I can run the Monday standup without manually collating updates. |
| O-02 | **Lead Pipeline Board + CRM Sync** | M | As a sales lead, I want to view and update the status of all inbound leads from the website in a pipeline board, with leads auto-syncing from the website form, so that no prospect falls through the cracks and the team always works from a single source of truth. |
| O-03 | **Client Onboarding Checklist** | S | As a delivery consultant, I want a standardised onboarding checklist automatically created for each new client, so that every engagement starts consistently and nothing is missed. |
| O-04 | **Invoice from Milestone** | M | As the operations lead, I want to generate and send a client invoice directly from a completed project milestone, so that billing is prompt, traceable, and not dependent on manual reminders. |
| O-05 | **Post-Delivery Retrospective** | S | As a delivery consultant, I want to complete a structured post-delivery retrospective template for each client project, so that automation patterns, pitfalls, and reusable components are captured in a shared knowledge base. |

## Admin Dashboard (A)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| ~~A-01~~ | ~~**Admin route + layout scaffold**~~ | S | ~~Add `/admin` route (lazy-loaded `AdminView.vue`) with `AdminLayout.vue` (sidebar nav, header). Route guard blocks unauthenticated access.~~ Geïmplementeerd 2026-04-09. |
| ~~A-02~~ | ~~**Auth guard + login flow**~~ | M | ~~`useAuthStore` (Pinia) with login/logout, JWT storage. Add `/admin/login` route; redirect unauthenticated users.~~ Geïmplementeerd 2026-04-09. Inclusief backend: `AInternAdminStack` (API Gateway + Lambda + SSM), `/admin/register` first-run flow, esbuild voor alle Lambda handlers. |
| A-03 | **Role-based access** | S | Extend auth store with `role: 'admin' \| 'editor'`. Conditionally render nav items and block API calls per role. **Lage prioriteit — niet vandaag (Human Board 2026-04-18).** |
| A-04 | **Kennisbank article list view** | S | `/admin/kennisbank` — paginated table of articles with status, slug, last-modified. Sortable columns. |
| A-05 | **Article create/edit form** | M | Rich text editor (TipTap) + frontmatter fields (title, slug, tags, published). Save drafts, publish to S3. |
| ~~A-06~~ | ~~**Article delete + unpublish**~~ | S | ~~Soft-delete with confirmation modal. Unpublish updates S3 JSON without removing the record.~~ Geïmplementeerd als onderdeel van A-05/B-28 (commit 25aeded) — `showDeleteConfirm` modal + `handleDelete()` in `KennisbankArticleFormView.vue`. |
| A-07 | **LinkedIn outreach dashboard** | M | Read outreach logs from `product/marketing/leads/`. Show connection status, DM sent/pending, conversion rate per DM variant. |
| A-08 | **Lead management table** | M | Upload CSV, view lead pipeline, mark as contacted/converted. Integrates with existing outreach scripts. |
| ~~A-09~~ | ~~**KPI dashboard**~~ | M | ~~Display Q2 OKR progress per C-level (CEO/CMO/CPO/CTO/COO). Charts via vue-chartjs.~~ Geimplementeerd 2026-04-09. |
| A-10 | **Morning briefing history** | S | List past briefing logs with links to source data. Read-only audit trail. |
| A-11 | **Admin i18n strings** | S | Add `admin.*` keys to `en.json` / `nl.json`. All admin UI strings translated from day one. |
| A-12 | **Admin unit + E2E tests** | M | Vitest specs for auth store, route guard, form validation. Playwright E2E for login → article create → publish flow. |
| ~~A-13~~ | ~~**Data-driven KPI integrations — persist & surface actuals**~~ | L | ~~Replace manual localStorage actuals with live DB reads. Integrations: (1) outreach log → connections sent, DMs sent, inbound leads; (2) Kennisbank publish events → article count; (3) uptime/security checks → uptime %, check done/not done. Manual fallback retained for metrics without an integration (e.g. discovery calls, pipeline reviews). Depends on A-04, A-07, A-09, A-14.~~ Geïmplementeerd 2026-04-11. Commits: 999dd0f, 418b91d, 519f663, e23f318. |
| ~~A-14~~ | ~~**DynamoDB backend — KPI actuals + meeting action items**~~ | L | ~~Provision a DynamoDB table (or extend the existing `AInternAdminStack`) to persist KPI actuals and meeting action items. Schema: KPI actuals keyed by `weekISO + metricId`; action items keyed by `meetingDate + itemId` with fields: `assignee`, `description`, `dueDate`, `status` (open/done), `obsidianFile` (filename relative to the `AIntern Meeting Minutes` folder in the Obsidian vault at `OneDrive/Documents/Obsidian Vault/Bill`). Lambda CRUD endpoints behind the existing API Gateway. Required by A-13 and A-15.~~ Geïmplementeerd 2026-04-11. Commits: 999dd0f, 418b91d. |
| A-15 | **Admin meeting action items view** | M | `/admin/meetings` — list and manage action items from C-level meetings. Reads/writes via A-14 Lambda endpoints. Table columns: date, assignee, description, due date, status (open/done), link to Obsidian meeting minutes file. Meeting minutes (.md files) live in the `AIntern Meeting Minutes` folder inside the Obsidian vault (`OneDrive/Documents/Obsidian Vault/Bill`); the `obsidianFile` field on each action item stores the filename relative to that folder (e.g. `2026-04-10-clevel-meeting.md`). Inline status toggle; filter by assignee and status. Depends on A-14. |
| A-16 | **Organisatie-overzicht: actieve AIntern-agents + hiërarchie** | S | `/admin/organisation` — overzicht van alle actieve AIntern-agents (CEO, CMO, CTO, COO en subagents), hun rollen, verantwoordelijkheden en onderlinge hiërarchie. Statische pagina in eerste versie; later koppeling aan live agent-status. OKR 5.2 — deadline: 22 april 2026. |
| A-17 | **MFA / SSO beveiliging voor /admin** | M | Beveilig het /admin dashboard met een tweede authenticatiefactor (TOTP-based MFA of SSO via Google/Microsoft). Uitbreiden van A-02 auth store en de bestaande Lambda backend. OKR 5.4 — vereist bij launch van /admin. |
| A-18 | **Organisatieoverzicht uitbreiden: alle agents + iconen** | S | Uitbreiding van `/admin/organisation` (geïmplementeerd B-12): voeg alle sub-agents toe die door C-level agents worden gebruikt (bijv. marketing-super-team, social-content, outreach, linkedin-outreach, backlog-manager), inclusief hun rol en hiërarchische positie. Elke agent krijgt een persoonlijk icoon of visuele representatie (avatar, emoji of SVG-icon). Human Board verzoek 2026-04-17. Spec vereist vóór implementatie. |
