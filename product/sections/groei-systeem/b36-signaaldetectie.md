# B-36 — Signaaldetectie Lambda

**Backlog ID:** B-36  
**Owner:** CTO  
**Effort:** M  
**Depends on:** DynamoDB `aintern-admin` (live), reddit_hot_topics_detector PoC (`product/sections/reddit_hot_topics_detector/spec.md`)  
**Triggers:** B-61 (Insight Extractie)

---

## Purpose

Daily Lambda scrapet Reddit op MKB-pijnsignalen en slaat 3–5 gekwalificeerde pains per dag op in DynamoDB als input voor stap 2 (Insight Extractie).

De te monitoren subreddits worden **beheerd via de Admin** (`/admin/signalen`) — niet hardcoded. Dit maakt het systeem uitbreidbaar zonder code-deploy.

---

## Data Models

### PainSignal

```typescript
// src/types/painSignal.ts

export type PainSignalStatus = 'new' | 'processed' | 'archived'
export type PainUrgency = 'high' | 'medium' | 'low'

export interface PainSignal {
  id: string           // UUID v4
  source: 'reddit'     // extensible naar 'twitter' | 'linkedin'
  sourceUrl: string
  subreddit: string
  title: string
  text: string
  painCategory: string  // 'manual_process' | 'tool_cost' | 'scaling_issue' | 'integration_gap'
  persona?: string      // bijv. "DGA webshop 5–25 FTE"
  urgency: PainUrgency
  hotScore: number      // score + (comments × 3)
  status: PainSignalStatus
  opportunityId?: string
  createdAt: string
}
```

### SubredditConfig

```typescript
// src/types/subredditConfig.ts

export interface SubredditConfig {
  name: string       // subreddit naam zonder r/, bijv. 'smallbusiness'
  active: boolean
  signalCount: number  // bijgehouden na elke B-36 run (denormalized)
  addedAt: string
  updatedAt: string
}
```

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `PAIN#<id>` | `SIGNAL` | `STATUS#<status>` | `<createdAt>` |
| `SUBREDDIT#<name>` | `CONFIG` | `STATUS#active` | `<addedAt>` |

**Seed data (eenmalig bij deploy):**

```
smallbusiness, Entrepreneur, startups,
netherlands, dutchentrepreneurs,
automation, nocode
```

---

## Lambda: `lambda/src/signaaldetectie.ts`

**Trigger:** EventBridge cron `0 6 * * ? *` (08:00 Amsterdam / 06:00 UTC)

### Logic

1. **Laad actieve subreddits** uit DynamoDB: query `GSI1pk = STATUS#active` op `SUBREDDIT#` items
2. Fetch posts per subreddit via Reddit public JSON API (`User-Agent` header, geen auth)
3. Filter: alleen posts waarvan `subreddit` in de geladen lijst staat (fix PoC off-topic issue)
4. Deduplicate op `sourceUrl`
5. Bereken `hotScore = score + (comments × 3)`, filter `hotScore < 10`
6. Claude Haiku classificeert top-20 candidates op painCategory, persona, urgency
7. Selecteer top 3–5 op hotScore
8. Sla op in DynamoDB — skip als `sourceUrl` al bestaat (idempotent)
9. **Verhoog `signalCount`** op de bijbehorende SubredditConfig (+1 per opgeslagen pain)

### Pain-trigger keywords (pre-filter voor Haiku-aanroepen)

```typescript
const PAIN_KEYWORDS = [
  'hoe automatiseer', 'how do i automate',
  'kost te veel tijd', 'takes too much time',
  'te duur', 'too expensive', "can't afford",
  'handmatig', 'manually every', 'repetitief',
  'keeps breaking', 'always forgetting',
]
```

### Claude Haiku prompt

```
Analyseer deze Reddit post en retourneer ONLY valid JSON zonder markdown:
{
  "painCategory": "manual_process|tool_cost|scaling_issue|integration_gap|other",
  "persona": "<korte beschrijving doelgroep>",
  "urgency": "high|medium|low",
  "isMkbRelevant": true|false
}

Post titel: {title}
Post tekst: {text}
Subreddit: {subreddit}
```

Alleen opslaan als `isMkbRelevant: true`.

---

## Lambda: `lambda/src/subreddit-config.ts`

Admin CRUD voor SubredditConfig. JWT-protected.

| Method | Path | Actie |
|---|---|---|
| `GET` | `/subreddit-config` | Lijst alle subreddits (actief + inactief) |
| `POST` | `/subreddit-config` | Voeg nieuw subreddit toe (`active: true`, `signalCount: 0`) |
| `PUT` | `/subreddit-config/:name` | Toggle `active` of update velden |
| `DELETE` | `/subreddit-config/:name` | Verwijder subreddit (met bevestiging in UI) |

**POST body:**
```json
{ "name": "freelance" }
```

**Validatie:** `name` mag geen spaties of `r/` prefix bevatten. Max 30 tekens. Lowercase.

---

## Admin View: `/admin/groei-systeem` — tabs Subreddits & Pains

Subreddit-beheer en recente pains zijn tabs binnen de bestaande `/admin/groei-systeem` view (B-63). Geen aparte route of sidebar-item.

### Tab: Subreddits

```
[+ Subreddit toevoegen]

| Naam            | Status  | Signalen | Toegevoegd | Acties        |
|-----------------|---------|----------|------------|---------------|
| smallbusiness   | ● actief| 42       | 2026-04-28 | [Uit] [Delete]|
| netherlands     | ● actief| 18       | 2026-04-28 | [Uit] [Delete]|
| freelance       | ○ uit   | 3        | 2026-05-01 | [Aan] [Delete]|
```

- **Toevoegen:** inline input + "Toevoegen" knop — POST naar Lambda
- **Toggle:** "Aan" / "Uit" knop — PUT naar Lambda, direct zichtbaar
- **Delete:** knop met confirm-modal — DELETE naar Lambda
- `signalCount` toont hoeveel pains dit subreddit heeft opgeleverd (context voor beslissing)

### Tab: Pains

Tabel: `subreddit`, `title` (ingekort, link naar sourceUrl), `urgency` badge, `painCategory`, `createdAt`.  
Laatste 20 PainSignals. Doel: snel inzicht of de juiste pains binnenkomen. Read-only.

### Composable

```
src/composables/useSubredditConfig.ts
```

Wraps CRUD calls. Exposes: `subreddits`, `fetchSubreddits()`, `addSubreddit()`, `toggleActive()`, `removeSubreddit()`.

---

## PoC Learnings (integreren)

Zie `product/sections/reddit_hot_topics_detector/spec.md` §8:
- Reddit public JSON werkt zonder auth — alleen `User-Agent` header
- Deduplicatie op post ID volstaat
- `min_score = 10` is een werkbare baseline
- Subreddit allowlist filter is **kritiek** — zonder dit komen off-topic resultaten door
- Claude Haiku werkt voor JSON extractie, prompt moet "ONLY valid JSON" bevatten

---

## Acceptance Criteria

- [ ] Lambda laadt subreddit-lijst uit DynamoDB bij elke run (niet hardcoded)
- [ ] 3–5 PainSignals per run opgeslagen in DynamoDB
- [ ] Deduplicatie: geen dubbele `sourceUrl` entries
- [ ] `status: 'new'` bij aanmaak
- [ ] `hotScore`, `urgency`, `painCategory` aanwezig op elk item
- [ ] `isMkbRelevant: false` → niet opgeslagen
- [ ] `signalCount` op SubredditConfig bijgewerkt na elke run
- [ ] Lambda < 30s uitvoertijd
- [ ] `/admin/groei-systeem` tab Subreddits — toevoegen/togglen/verwijderen werkt
- [ ] `/admin/groei-systeem` tab Pains toont recente PainSignals
- [ ] Seed-data (7 subreddits) aangemaakt bij eerste deploy
- [ ] Errors gelogd via CloudWatch

## Out of Scope

- X / Twitter als bron (toekomstige extensie)
- Keyword-beheer via admin (keywords blijven in Lambda code)
- Notion sync (DynamoDB is primary store)
