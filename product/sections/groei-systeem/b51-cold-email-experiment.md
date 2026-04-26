# B-51 — Cold Email Precisie-experiment

**Backlog ID:** B-51  
**Owner:** CMO  
**Effort:** M  
**Depends on:** B-61 (Opportunity Statements, priority = 'high'), Apollo.io gratis tier  
**Doel:** Valideer reply-rate van insight-driven cold email vóór automatisering (B-52)

---

## Purpose

Handmatig experiment om te meten of context-gedreven cold email werkt voor AIntern's ICP. Geen volume, maar precisie. 15 targets in week 1, winnende variant schalen in week 2.

**Start B-52 pas na:** reply-rate ≥ 10% op winnende variant.

---

## ICP (Ideal Customer Profile)

- **Functie:** DGA / Directeur / Operations Manager
- **Bedrijfsgrootte:** 11–50 FTE
- **Sector:** webshop / productie / zakelijke dienstverlening
- **Land:** Nederland
- **Signaal:** painCategory matcht Opportunity Statement met `priority = 'high'`

---

## Email Structuur (4 blokken)

| Blok | Inhoud | Max |
|---|---|---|
| **Context** | Specifieke observatie over dit bedrijf of sector | 2 zinnen |
| **Insight** | Relevant pijnpunt — concreet, herkenbaar | 2 zinnen |
| **Idee** | Concrete verbeterkans — geen pitch, geen features | 2 zinnen |
| **CTA** | Zacht: vraag om feedback of 15-minuten call | 1 zin |

**Totaal:** max 150 woorden. Geen attachment. Geen unsubscribe-link (geen bulk).  
**Onderwerpregel:** specifiek, nieuwsgierigheid-triggend, geen "AI" of "automatisering" in onderwerp.

---

## A/B/C Varianten

| Variant | Openingsfocus | Voorbeeld opening |
|---|---|---|
| **A — ROI** | Kwantificeerbare tijdsbesparing | "Webshops in jouw sector besparen gemiddeld 8 uur/week door [X] te automatiseren" |
| **B — Nieuwsgierigheid** | Onverwachte observatie | "Ik zag iets opvallends in hoe [sector] bedrijven [proces] aanpakken" |
| **C — Resultaat** | Concreet resultaat soortgelijk bedrijf | "Een [sector] bedrijf van 20 mensen schrapte vorig kwartaal 6 uur/week handmatig werk" |

---

## Uitvoering Week 1

| Stap | Actie |
|---|---|
| 1 | Selecteer 15 targets uit Apollo (ICP + sector matcht OpportunityStatement) |
| 2 | Verdeel: 5 per variant (A/B/C) |
| 3 | Schrijf emails met correcte 4-blok structuur, variant-opening |
| 4 | Verstuur handmatig via Gmail (Bill's account) |
| 5 | Wacht 7 dagen |
| 6 | Tel replies, log in experiment-log.csv |

---

## Meting

**Logboek:** `product/marketing/cold-email/experiment-log.csv`

```csv
datum,variant,doelwit_bedrijf,email_adres,sector,opportunity_id,verstuurd_op,reply,reply_datum,notes
```

**Succes-drempel:**
- Winnaar: reply-rate ≥ 10% op 1 variant (≥ 1 reply op 5 verstuurd)
- Geen winnaar: alle varianten < 10% → email structuur herzien, niet direct naar B-52

**CTO check B-55:** reply-rate rapport na 7 dagen (deadline 2026-05-02).

---

## Tools

| Doel | Tool | Limiet |
|---|---|---|
| Email discovery | Apollo.io gratis | 50 credits/maand |
| Versturen | Gmail (Bill) | Handmatig |
| Tracking | Handmatig in experiment-log.csv | — |

**Niet gebruiken:** bulk email tools, tracking pixels, unsubscribe flows.

---

## Acceptance Criteria

- [ ] Minimaal 15 emails verstuurd in week 1 (5 per variant)
- [ ] Alle emails volgen exact het 4-blok format (max 150 woorden)
- [ ] Elk email verwijst naar specifiek OpportunityStatement
- [ ] `experiment-log.csv` aangemaakt en bijgehouden
- [ ] Na 7 dagen: winnende variant geïdentificeerd of "geen winnaar" gedocumenteerd
- [ ] CTO (B-55) informeert CEO over resultaat voor beslissing B-52

## Out of Scope

- Automatisch versturen (dat is B-52)
- Apollo API integratie (handmatige export volstaat)
- Email open-tracking
