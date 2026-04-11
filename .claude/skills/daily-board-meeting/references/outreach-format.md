# LinkedIn Outreach Format

## Connection Request Message Rules

- **Language:** Dutch
- **Max length:** 200 characters (hard limit — messages over this are rejected by LinkedIn)
- **Tone:** Direct, peer-to-peer. Not salesy. Lead with the prospect's reality.
- **CTA:** Soft — curiosity or a question, never "buy now"

## Approved Template (Lightspeed Webshop Owners)

> Hoi {voornaam}, ik zie dat je een Lightspeed webshop runt. Wij helpen webshophouders met AI om 60 min producttijd terug te brengen naar 5 min. Mag ik je meer vertellen?

Character count: ~170 — within limit.

## Rotation Plan (3 Variants)

Use the variant that matches the lead's profile. Rotate per 10 leads. Scale the winning variant after 30.

| Variant | Angle | Template |
|---------|-------|----------|
| ROI | Cost & time saving | "Hoi {naam}, wij helpen Lightspeed webshops om 60 min/product terug te brengen naar 5 min — zonder IT-kennis. Zou dat iets voor jou zijn?" |
| Nieuwsgierigheid | Curiosity hook | "Hoi {naam}, hoe lang doe jij er over om één product in Lightspeed in te voeren? Wij doen het in 5 minuten met AI. Benieuwd?" |
| Resultaat | Social proof | "Hoi {naam}, we helpen Lightspeed-webshops al 2 weken na intake met AI-automatisering. No cure no pay. Zin om even te sparren?" |

## Lead File Location

```
product/marketing/leads/
```

**Current CSV (`2026-04-03_lightspeed-webshops-nl.csv`) columns:** `website`, `email`, `telefoon`, `instagram`, `facebook` — **no LinkedIn URLs and no names.** Connection requests from this file are not possible until the CSV is enriched.

Run Apify enrichment (via `apify-lead-generation` skill) to add LinkedIn profile URLs before attempting connection requests from this list.

For the **pending DMs** (accepted connections awaiting icebreaker): check `.claude/cmo/memory_outreach_dm_pending.md` — these are tracked separately from the CSV and should always be prioritised over new cold requests.

## Post-Approval Handoff

After Human Board approval, pass the approved messages to the `linkedin-outreach` agent with:
- Lead name and LinkedIn URL
- Approved message text
- Variant used (for tracking)

The `linkedin-outreach` agent handles: rate limiting (5–10/day), logging to `outreach-log.csv`, and the 2-step sequence (connection → icebreaker DM on acceptance).
