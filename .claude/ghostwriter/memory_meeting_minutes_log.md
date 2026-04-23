---
name: Meeting Minutes Log — Ghostwriter
description: Bijhoudt welke feiten uit de AIntern daily meeting minutes al gebruikt zijn in posts; voorkomt overlap en hergebruik van dezelfde feiten
type: project
---

# Meeting Minutes Log

_Last updated: 2026-04-22_

## Gebruiksregel

Elk feit dient als **inspiratiebron**, niet als letterlijke inhoud van een post.

- Kies één feit als thema en vertrekpunt
- Vertaal het naar Bills beleving, de spanning, de keuze — niet als feitelijke opsomming
- Noem geen namen van leads, backlog-nummers, of interne notaties in de post zelf
- Elk feit maximaal één keer als hoofdthema gebruikt

Vóór het schrijven: controleer welke feiten nog beschikbaar zijn. Na het schrijven: markeer het gebruikte feit als "gebruikt".

---

## Beschikbare feiten (nog niet gebruikt als post)

| Datum | Feit | Bron | Status |
|-------|------|------|--------|
| 2026-04-09 | OKR Q2 vastgesteld door board: 300 LinkedIn connecties, 10 inbound leads, 20 kennisbank-artikelen als targets | memory_okr_q2_2026.md | gebruikt (ep.1) |
| 2026-04-09 | LinkedIn aangewezen als primair acquisitiekanaal; target 20–25 nieuwe connecties per week | memory_okr_q2_2026.md | beschikbaar |
| 2026-04-11 | Eerste outreach DMs handmatig verstuurd door Bill: Bram Hofman, Jan Bulthuis, Bob van Boekel — ROI-variant berichten | memory_outreach_dm_pending.md | beschikbaar |
| 2026-04-11 | Security check week 15: 3 high-severity bevindingen — Calendly webhook zonder HMAC-verificatie, JWT in localStorage, adminAxios zonder auth interceptor | memory_security_check_2026-04-11.md | beschikbaar |
| 2026-04-12 | OKR O3 herzien: delivery-deadlines vervallen, focus verschoven naar organische vindbaarheid (SEO + LLM/GEO) | memory_okr_q2_2026.md | beschikbaar |
| 2026-04-16 | Lambda CORS-wildcard gefixed: hardcoded `*` vervangen door corsOrigin()+respond() patroon in calendly-webhook.ts en intake.ts (B-21) | git-commit 7b47c1b | beschikbaar |
| 2026-04-16 | Security check week 16: Vite path traversal vulnerability (HIGH) gevonden; CORS-wildcard op 2 Lambda handlers; v-html zonder DOMPurify in kennisbank view | memory_security_check_2026-04-16.md | beschikbaar |
| 2026-04-16 | Keyword strategie analyse gepubliceerd voor aintern.nl (B-18) | git-commit 59b7980 | beschikbaar |
| 2026-04-17 | Sitemap opnieuw gegenereerd + npm run sitemap:generate script toegevoegd (B-24) | git-commit 2c8c19e | beschikbaar |
| 2026-04-17 | Lead Pipeline Kanban spec geschreven: O-02 gesplitst in fase 1 (read-only) en fase 2 (drag-and-drop + DynamoDB write) | git-commit 53eeb6c | beschikbaar |
| 2026-04-17 | Kennisbank artikel create/edit form spec geschreven met TipTap editor en Lambda endpoints (A-05, B-25) | git-commit ff0d205 | beschikbaar |
| 2026-04-18 | Kennisbank artikel create/edit form live: TipTap editor, Lambda CRUD endpoints, sitemap auto-regeneratie (A-05) | git-commit 25aeded | beschikbaar |
| 2026-04-18 | /admin/organisation uitgebreid met alle agents, emoji-iconen en sub-agent hiërarchie (B-29/A-18) | git-commit 42a2f37 | beschikbaar |
| 2026-04-18 | Social proof / Testimonials sectie spec aangemaakt voor de landingspagina (B-32) | git-commit d710a08 | beschikbaar |
| 2026-04-19 | Test suite opgezet: 112 tests groen — sitemap + Lambda API endpoint tests (B-34, B-35) | git-commit 935c167 | beschikbaar |
| 2026-04-19 | RTK token-killer geactiveerd in Claude Code pipeline; PreToolUse hook gerepareerd (B-33) | git-commit 9dcc05c | beschikbaar |
| 2026-04-20 | B-38: Read-only Lead Pipeline Kanban live op /admin/leads — CSV naar Lambda naar Kanban-view | git-commit 8ee64ff | beschikbaar |
| 2026-04-20 | B-43: LinkedIn Posts admin live op /admin/linkedin — volledig CRUD via Lambda + Vue UI | git-commit fbc83d2 | beschikbaar |
| 2026-04-20 | B-40: Eerste Kennisbank artikel gepubliceerd: "De startup van de toekomst: 2 AI operators" — JSON naar S3 | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | B-39: LinkedIn outreach uitgesteld — board besloot strategie eerst te bepalen; 5 leads klaar (Franny, Denise, Ilse, Nick, Bep) | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | Human Board approval vereist voor alles wat naar buiten gaat — goedgekeurd als vaste werkwijze | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | 2 open connectieverzoeken wachten op acceptatie (Hilde Bolks — liatelier.nl, Robert Theuws — homefitness4you.nl) | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | Ghostwriter aangesteld als Human Board direct report; organogram bijgewerkt (B-44) | git-commit 9db8d2f | beschikbaar |
| 2026-04-20 | O-02 gesplitst in 2 fases in board-beslissing; fase 1 = read-only Kanban, fase 2 = drag-and-drop + DynamoDB write | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | Skill v0.3.7 uitgebracht: admin cross-referentie check en Growth Levers Check toegevoegd | board-meeting-2026-04-20 | beschikbaar |
| 2026-04-20 | Token spend: $99.69 per week geconstateerd — B-37 right-size Claude models als prioriteit benoemd | memory_daily_context.md (cto) | beschikbaar |
| 2026-04-22 | Copy-knop toegevoegd aan LinkedIn admin (feature voor CMO workflow) | git-commit a89c516 | beschikbaar |

## Gebruikte feiten (al als post-thema ingezet)

| Episode | Feit | Post datum |
|---------|------|------------|
| 1 | OKR Q2 vastgesteld begin april — harde targets voor een bedrijf dat nauwelijks bestond | 2026-04-27 |

---

## Instructie bij nieuwe meeting minutes

Wanneer een nieuwe board meeting plaatsvindt:
1. Voeg de feiten toe aan de tabel "Beschikbare feiten"
2. Noteer datum en bron
3. Markeer als "beschikbaar"
