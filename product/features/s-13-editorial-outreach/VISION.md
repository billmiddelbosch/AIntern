# S-13 — Editorial Outreach Vision
**Groei-systeem: geautomatiseerde editorial outreach voor MKB AI-mentions**

**Backlog ID:** S-13  
**Tags:** groei-systeem, SEO  
**Priority:** P2  
**Effort:** L  
**Owner:** CMO (strategie + goedkeuring), CTO (implementatie)  
**Status:** Vision fase — spec volgt  
**Date:** 2026-05-04

---

## Probleemstelling

aintern.nl scoort nog niet op de category-defining queries die MKB-ondernemers typen als ze op zoek zijn naar AI-tooling: "beste AI tools MKB", "AI automatisering MKB", "no-code AI voor webshops". De reden is tweeledig:

1. **Autoriteit ontbreekt.** Google rankt sites mede op basis van het vertrouwen van andere gezaghebbende domeinen. aintern.nl heeft nauwelijks inkomende links van Nederlandse vakpublicaties.
2. **Zichtbaarheid bij beslissers ontbreekt.** Redacteuren van MKB-vakbladen (Sprout, ZiPconomy, AG Connect) schrijven regelmatig ronde-tafels, "beste tools"-lijstjes en sectoranalyses. Wanneer aintern.nl daarin wordt vermeld — ook al is het één regel — levert dat direct kwalitatief verkeer én een dofollow-backlink.

De content staat al op de site (Kennisbank, use-cases, no-cure-no-pay propositie). Wat ontbreekt is de brug naar de redacties die die content willen citeren of aanvullen.

---

## Visie

> **aintern.nl wordt systematisch opgenomen in de "AI tools voor MKB"-narratieven die Dutch tech- en ondernemerspublicaties schrijven — door proactief contact te leggen met redacteuren, op het moment dat ze net een relevant artikel hebben gepubliceerd of er aantoonbaar mee bezig zijn.**

Het groei-systeem doet dit schaaf voor schaaf: het monitort publicaties, identificeert relevante artikelen, bepaalt de juiste contactpersoon per publicatie en stuurt een gepersonaliseerde outreach-mail. Het systeem werkt geautomatiseerd, maar Bill keurt elke mail goed vóór verzending — want redactionele relaties zijn mensenwerk.

---

## Waarom nu

- **SEO-flywheel:** Backlinks van Sprout.nl, ZiPconomy of AG Connect tellen zwaarder dan 100 generieke directory-links. Eén goede vermelding schroeft de domeinautoriteit merkbaar op.
- **Timing voordeel:** aintern.nl is vroeg in de markt. Concurrenten als mkb-aigent.nl hebben geen actief editorial outreach programma. Redacteuren schrijven nu actief over "AI voor MKB" — dat momentum is tijdelijk.
- **Synergie met bestaand groei-systeem:** De pijnsignalen uit de Pain Database (B-36), de opportunity statements (B-61) en de cold-email infra (SES + sequence-scheduler) zijn er al. S-13 bouwt op hetzelfde fundament.
- **Lage marginale kosten:** De SES-infra en sequence-scheduler draaien al. De toevoeging is een nieuwe doelgroep (redacteuren) met eigen templates — geen nieuw technisch fundament.

---

## Doelgroep — publicaties

| Publicatie | Type | Doelgroep lezers | Reden voor prioriteit | RSS |
|---|---|---|---|---|
| Sprout.nl | Ondernemersblad | MKB-eigenaren, startups | Hoge domeinautoriteit; actief over AI-tools | Ja |
| ZiPconomy | HR / Future of Work | HR-managers, directeuren | Schrijft over "AI op de werkvloer" — direct relevant | Ja |
| AG Connect | ICT-vakblad | IT-beslissers, CTO's MKB | Diepte-artikelen over AI-implementatie | Ja |
| MKB Servicedesk | MKB-platform | Ondernemers < 50 medewerkers | Directe doelgroep; "tools voor MKB"-format | Ja |
| Emerce.nl | Digitale economie | Marketing/IT-managers MKB | Brede bereik; schrijft over digitalisering en AI | Ja |
| Computable.nl | ICT-nieuws | IT-professionals, CTO's | Actief over AI-implementatie in bedrijven | Ja |
| slimiq.nl | AI tools voor MKB | MKB-eigenaren | Niche AI-tools vergelijksite | Nee |
| ambrix.nl | Business / ondernemen | Zelfstandige ondernemers | Groeiend platform; actief over productiviteits-AI | Nee |
| timmermansmedia.nl | MKB nieuws | MKB-eigenaren, coaches | Schrijft over digitalisering MKB | Nee |

**Fase 1 (RSS beschikbaar):** Sprout, ZiPconomy, AG Connect, MKB Servicedesk, Emerce, Computable  
**Fase 2 (handmatige input, geen RSS):** slimiq.nl, ambrix.nl, timmermansmedia.nl

---

## De drie outreach-angles

Elke outreach-mail combineert één angle met één specifieke artikel-haak:

| Angle | Kern van het aanbod | Wanneer gebruiken |
|---|---|---|
| **Gratis account** | "Ik geef je redactie gratis toegang om AIntern te testen vóór publicatie" | Bij "tools-test" artikelen of vergelijkingen |
| **Case study** | "Ik heb een concrete case van een Lightspeed webshop die X% tijd bespaarde — wil je die als voorbeeld gebruiken?" | Bij sector-verhalen of "resultaten in de praktijk" stukken |
| **Expert quote** | "Als AI-automatiseringsspecialist voor het MKB kan ik een bruikbare uitspraak leveren over [onderwerp artikel]" | Bij opiniestukken, trends-artikelen of "wat te verwachten van AI" stukken |

---

## Hoe succes eruitziet

**Primair doel:** 3–5 nieuwe dofollow-backlinks van Nederlandse MKB/AI-publicaties per kwartaal.

**Secondaire indicatoren:**
- Open rate outreach-mails ≥ 30%
- Reply rate ≥ 10% (redactionele context — lager dan B2B-sales, maar waardevoller)
- Minimaal 1 vermelding per kwartaal in top-3 prioriteitspublicaties (Sprout, ZiPconomy, AG Connect)
- Geen spam-signalen: bounce rate < 5%, geen unsubscribe-klachten van redacteuren

**Meetmoment:** Einde van elk kwartaal. CMO rapporteert in weekrapport en board meeting.

---

## Relatie met andere onderdelen

| Onderdeel | Relatie |
|---|---|
| B-36 Signaaldetectie | **Dual-purpose:** de `signaaldetectie` Lambda scant nu ook de RSS-feeds van de doelpublicaties. RSS-items worden gelijktijdig beoordeeld als pain signal én als editorial opportunity — één Haiku-call, twee uitkomsten |
| B-52 Cold email sequentie | Deelt de sequence-scheduler Lambda; editorial outreach is een aparte doelgroep met eigen templates |
| B-88e SES-infra | Deelt de SES-verzendfunctionaliteit; afzender `sanne@aintern.nl` |
| S-10 SEO landing page | Backlinks verwijzen idealiter naar de nieuwe "AI agent MKB"-landingspagina |
| S-11 Kennisbank artikelreeks | Expert quotes en case studies verwijzen naar Kennisbank-artikelen als bewijs |
| LinkedIn outreach | Loopt parallel — geen overlap, andere doelgroep (redacteur vs. MKB-ondernemer) |

---

## Wat buiten scope valt

- Betaalde advertorials of gesponsorde content
- Outreach naar niet-Nederlandse publicaties (Engelstalige SEO is buiten de Q2-horizon)
- Volledig automatisch versturen zonder menselijke goedkeuring — Bill keurt elke outreach-mail goed vóór verzending
- Link building via directory submissions, forums of comment spam
- Affiliate-constructies of paid reviews
- Meer dan 2 follow-up mails per contactpersoon (spam-risico)
- Automatische parsing van redacteur-email vanuit publicatiesites zonder handmatige verificatie (GDPR-risico)

---

## Risico's en mitigaties

| Risico | Kans | Mitigatie |
|---|---|---|
| Redacteur markeert als spam | Middel | Persoonlijke, artikel-specifieke aanpak; nooit bulk; lage verzendfrequentie |
| RSS-feed onbereikbaar | Laag | Log + skip die publicatie; pipeline stopt niet; geen Apify afhankelijkheid — feeds worden direct via `fetch()` opgehaald |
| Contactpersoon niet vindbaar | Middel | Fallback naar redactie@/info@ adres van publicatie; of LinkedIn lookup |
| Geen reply na 2 mails | Laag risico | Sequentie stopt na 2 mails per contactpersoon; geen verdere vervolging |
| GDPR-risico redacteur email | Middel | Alleen bedrijfsemailadressen; geen personal Gmail; opt-out bij eerste reply |
