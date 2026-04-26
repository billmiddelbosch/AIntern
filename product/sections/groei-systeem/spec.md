# AI MKB Groei Systeem — Systeemoverzicht

**Owner:** CTO + CMO  
**Source:** board-meeting-2026-04-28

---

## Flywheel

```
Pain Signals → Opportunity Statements → Content → Inbound
     ↑                                                ↓
  nieuwe Signals ← Deals ← Outreach ← Leads ← Lead Magnets
```

Elke cyclus: sneller, relevanter, hogere kwaliteitsleads.

---

## Backlog Items

| Stap | ID | Spec | Beschrijving |
|---|---|---|---|
| 1 | B-36 | `b36-signaaldetectie.md` | Reddit Lambda → Pain Database, dagelijks |
| 2 | B-61 | `b61-insight-extractie.md` | Pain → Opportunity Statement, wekelijks |
| 3 | B-53 | `b53-content-engine.md` | Insights → LinkedIn/X posts, 3x/week |
| 4 | B-54 | `b54-lead-magnets.md` | AI Workflow Scanner, email capture |
| 5 | B-62 | `b62-soft-outreach.md` | Warm reageren op Reddit/X, DM bij intent |
| 6a | B-51 | `b51-cold-email-experiment.md` | Insight-driven cold email experiment |
| 6b | B-52 | `b52-cold-email-sequentie.md` | 4-staps geautomatiseerde sequentie |
| 7 | B-63 | `b63-flywheel-coordinatie.md` | Metrics, cadans, anti-patterns |

---

## DynamoDB Schema

Uitbreiding op bestaande `aintern-admin` single-table design.

| pk | sk | GSI1pk | GSI1sk | Module |
|---|---|---|---|---|
| `PAIN#<id>` | `SIGNAL` | `STATUS#<status>` | `<createdAt>` | B-36 |
| `SUBREDDIT#<name>` | `CONFIG` | `STATUS#active` | `<addedAt>` | B-36 admin |
| `OPPORTUNITY#<id>` | `STATEMENT` | `PRIORITY#<priority>` | `<createdAt>` | B-61 |
| `CONTENT#<id>` | `DRAFT` | `CHANNEL#<channel>` | `<scheduledFor>` | B-53 |
| `SCAN#<id>` | `SUBMISSION` | `STATUS#<status>` | `<createdAt>` | B-54 |
| `OUTREACH#<id>` | `ALERT` | `STATUS#<status>` | `<createdAt>` | B-62 |
| `SEQUENCE#<id>` | `ENTRY` | `STATUS#active` | `<nextSendAt>` | B-52 |

---

## Lambda Stack

| Lambda | Trigger | File |
|---|---|---|
| `signaaldetectie` | EventBridge dagelijks 08:00 UTC | `lambda/src/signaaldetectie.ts` |
| `subreddit-config` | API Gateway CRUD | `lambda/src/subreddit-config.ts` |
| `insight-extractie` | EventBridge maandag 09:00 UTC | `lambda/src/insight-extractie.ts` |
| `content-engine` | EventBridge woensdag 09:00 UTC | `lambda/src/content-engine.ts` |
| `soft-outreach-monitor` | EventBridge dagelijks 09:00 UTC | `lambda/src/soft-outreach-monitor.ts` |
| `workflow-scan` | API Gateway POST `/workflow-scan` | `lambda/src/workflow-scan.ts` |
| `sequence-scheduler` | EventBridge dagelijks 08:00 UTC | `lambda/src/sequence-scheduler.ts` |

---

## Infrastructure Dependencies

- EventBridge rules per Lambda (CDK: `infra/lib/admin-stack.ts` uitbreiden)
- DynamoDB `aintern-admin` — bestaande tabel, nieuwe pk-patronen
- Bestaand corsOrigin + respond patroon verplicht op alle nieuwe handlers
- Claude API (Haiku voor classificatie/generatie — zie B-37 model matrix)
- Zapier MCP (`linkedin_create_company_update`) voor LinkedIn company posts
- Apollo gratis tier (50 credits/maand) voor email discovery B-51/B-52
- X API — prerequisite voor X posting in B-53, nog niet geconfigureerd

---

## Implementatievolgorde

```
B-36 → B-61 → B-53   (data pipeline eerst)
B-54                   (parallel — onafhankelijk)
B-62                   (na B-36 live)
B-51 → B-52            (B-51 eerst valideren vóór automatisering)
B-63                   (na alle stappen live)
```
