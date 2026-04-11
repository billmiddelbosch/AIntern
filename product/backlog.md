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
| **L-14** | **Marketing Alignment — Website verbeteringen obv go-to-market strategie** | M | 5 verbeteringen gebaseerd op GTM-sessie 2026-04-01. Spec: `product/sections/marketing-alignment/spec.md`. ~~Stap 1: verwijder onjuiste social proof claim~~ ✅ de4ef63. ~~Stap 2: herstel pilot-case cijfers~~ ✅ de4ef63. Stap 3–5 volgende sprint: (3) vervang hero headline door Big Idea, (4) voeg Godfather Offer sectie toe, (5) voeg intake-vragenlijst toe vóór book-a-call. |
| L-10 | **Social Proof / Testimonials Section** | M | Client quotes or logos to build trust. Ties into Resultaten & Cases narrative. |
| ~~L-11~~ | ~~**Blog / Kennisbank stub**~~ | M | ~~Placeholder section or route for future knowledge-base articles; improves SEO.~~ Geïmplementeerd 2026-04-02. |
| L-12 | **AI Interaction Panel** | L | Direct in-page interaction with the AI intern — chat interface or task demo widget. |
| L-13 | **Animations of Previous Assignments / Portfolio** | M | Animated showcase of past AI-intern work; visual portfolio to demonstrate capability. |

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

## Board Meeting Actions (B)

| ID | Feature | Effort | Owner | Status | Source | Success Metric |
|---|---|---|---|---|---|---|
| ~~B-01~~ | ~~**Wekelijkse security check uitvoeren en documenteren**~~ | S | CTO | ✅ done | board-meeting-2026-04-11 | Commit 6ba7260 — PASS WITH WARNINGS, 3 high findings gedocumenteerd in .claude/cto/memory_security_check_2026-04-11.md |
| B-03 | **Apify lead-enrichment: LinkedIn URLs toevoegen aan CSV** | S | CMO | todo | board-meeting-2026-04-11 (sessie 3) | ≥ 10 leads met LinkedIn URL in outreach-log; outreach pipeline gedeblokkeerd |

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
| A-03 | **Role-based access** | S | Extend auth store with `role: 'admin' \| 'editor'`. Conditionally render nav items and block API calls per role. |
| A-04 | **Kennisbank article list view** | S | `/admin/kennisbank` — paginated table of articles with status, slug, last-modified. Sortable columns. |
| A-05 | **Article create/edit form** | M | Rich text editor (TipTap) + frontmatter fields (title, slug, tags, published). Save drafts, publish to S3. |
| A-06 | **Article delete + unpublish** | S | Soft-delete with confirmation modal. Unpublish updates S3 JSON without removing the record. |
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
