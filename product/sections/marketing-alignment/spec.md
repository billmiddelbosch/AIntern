# Spec: Marketing Alignment — Website Verbeteringen

**Backlog ID:** L-14
**Prioriteit:** Hoog — uitvoeren vóór eerste LinkedIn post en outreach
**Bron:** Go-to-market strategie sessie 2026-04-01
**Referentie:** `product/marketing/go-to-market.md`

---

## Overzicht

Op basis van de vastgestelde go-to-market strategie (droomklant, Big Idea, Godfather
Offer) zijn 5 concrete verbeteringen geïdentificeerd voor de landingspagina. De
huidige website bevat claims en CTA's die niet aansluiten bij de strategie en een
actief credibiliteitsrisico vormen.

---

## Verbetering 1 — Verwijder social proof uit hero

**Type:** Verwijdering
**Component:** `src/components/sections/hero-value-proposition/HeroSection.vue`
**Prioriteit:** Kritiek — moet als eerste aangepakt worden

### Probleem
De hero-sectie toont:
- De tekst *"20+ MKB-bedrijven draaien al hun eigen AI-stagiaire"*
- Een avatar-stack van 4 placeholder-avatars

Dit is een onjuiste claim. Er is één pilot gedaan. Een warme lead die hierop
doorvraagt verliest direct vertrouwen.

### Oplossing
Verwijder het volledige `hero-social-proof` blok uit de template:
```html
<!-- VERWIJDEREN -->
<div class="hero-social-proof">
  <div class="avatar-stack" aria-hidden="true">
    <div v-for="i in 4" :key="i" class="avatar-placeholder" />
  </div>
  <span>{{ t('hero.socialProof') }}</span>
</div>
```

Verwijder ook de bijbehorende CSS classes:
- `.hero-social-proof`
- `.avatar-stack`
- `.avatar-placeholder`

De i18n-sleutel `hero.socialProof` kan behouden blijven voor toekomstig gebruik,
maar hoeft niet actief gebruikt te worden.

---

## Verbetering 2 — Vervang hero headline door Big Idea

**Type:** Content update
**Bestanden:**
- `src/locales/nl.json` — sleutels `hero.headline` en `hero.subtext`
- `src/locales/en.json` — Engelse equivalenten

### Probleem
Huidige headline: *"Jouw eigen AI-stagiaire, altijd aan het werk"*
Dit beschrijft het product maar raakt het gevoel van de droomklant niet.

### Oplossing

**NL:**
| Sleutel | Huidige waarde | Nieuwe waarde |
|---|---|---|
| `hero.headline` | Jouw eigen AI-stagiaire, altijd aan het werk | Iedereen voelt dat AI iets kan veranderen. Wij nemen het herhaalwerk dat uw dag opslokt uit handen. |
| `hero.subtext` | AIntern bouwt een dedicated AI-stagiaire voor jouw bedrijf — die jouw interne processen automatiseert als een extra medewerker. AI waar het werkt. Resultaat dat je kunt meten. | AIntern bouwt een eigen AI-stagiaire voor uw bedrijf — specifiek ingericht op uw processen, niet op een standaard template. U betaalt pas als het resultaat er is. |

**EN:** Engelse vertaling volgt zelfde structuur.

---

## Verbetering 3 — Voeg Godfather Offer toe als aparte sectie

**Type:** Nieuwe sectie
**Plaatsing:** Tussen de "Hoe het werkt"-sectie en de "Resultaten & Cases"-sectie
**Component:** Nieuw: `src/components/sections/godfather-offer/GodfatherOfferSection.vue`

### Doel
De huidige CTA ("Gratis kennismaking") is generiek en converteert minder dan een
concreet, tijdgebonden aanbod. De Godfather Offer sectie vervangt de vage CTA door
een specifiek aanbod dat alle drie waarde-scenario's dekt.

### Inhoud (NL)

**Koptekst:** Zo werkt het eerste gesprek

**Body:**
> In een gratis gesprek van 30 minuten berekenen we samen wat uw herhaalwerk u
> nu kost — in tijd, geld of gemiste omzet. Zie u de potentie? Dan laten we het
> in 2 weken concreet werken op uw Lightspeed webshop. Zie u daarna de waarde
> niet? U betaalt niks. We nemen maximaal 2 nieuwe klanten per kwartaal aan —
> zodat elke implementatie de aandacht krijgt die het verdient.

**Drie waarde-scenario's** (visueel als 3 kaarten):

| Scenario | Label | Omschrijving |
|---|---|---|
| A | Kostenbesparing | Betaalde medewerker of VA voert producten in → directe besparing op arbeidskosten |
| B | Tijdswinst | U doet het zelf → vrijgekomen uren voor hogere waarde |
| C | Gemiste omzet | Producten staan er niet → webkanaal presteert onder potentie |

**CTA-knop:** Plan een gratis gesprek van 30 minuten →

### Acceptatiecriteria
- [ ] Sectie toont de drie scenario-kaarten
- [ ] CTA linkt naar het book-a-call formulier (bestaande Calendly integratie)
- [ ] Sectie is responsive op mobile
- [ ] i18n sleutels aanwezig in nl.json en en.json

---

## Verbetering 4 — Voeg intake-vragenlijst toe vóór book-a-call

**Type:** UX toevoeging
**Component:** Bestaand contactformulier uitbreiden of nieuw kwalificatieformulier
**Plaatsing:** Vóór of als stap 1 van het Calendly-bookingproces

### Doel
Brunson's application funnel: laat de droomklant zichzelf kwalificeren. Dit filtert
tijdverspilling en maakt de droomklant nieuwsgieriger naar het gesprek.

### De 5 intake-vragen

| Nr | Vraag | Type |
|---|---|---|
| 1 | Hoeveel medewerkers heeft uw bedrijf? | Multiple choice: 1-5 / 6-20 / 21-50 / 50+ |
| 2 | Welk proces kost u of uw team de meeste tijd? | Open tekst |
| 3 | Hoelang duurt dat proces gemiddeld per keer? | Multiple choice: < 15 min / 15-60 min / 1-4 uur / > 4 uur |
| 4 | Heeft u al eerder geprobeerd dit te automatiseren? | Ja / Nee / Gedeeltelijk |
| 5 | Wat zou het voor u betekenen als dit proces wegviel? | Open tekst |

### Flow
1. Bezoeker klikt "Plan een gratis gesprek"
2. Intake-formulier verschijnt (modal of eigen pagina)
3. Na invullen → doorstuur naar Calendly voor timeslot-keuze
4. Antwoorden worden meegestuurd als notitie of e-mail naar AIntern

### Acceptatiecriteria
- [ ] 5 vragen in correct formaat (multiple choice + open)
- [ ] Progressie-indicator zichtbaar (stap 1/2)
- [ ] Formulier valideert verplichte velden vóór doorzending naar Calendly
- [ ] Antwoorden bereiken AIntern (e-mail of Lambda endpoint)
- [ ] GDPR-conform (geen opslag zonder toestemming)

---

## Verbetering 5 — Herstel pilot-case cijfers

**Type:** Content correctie
**Component:** `src/locales/nl.json` — resultaten-sectie

### Probleem
De website toont: *"Wat vroeger een uur kostte per batch, doet de AI nu in één
minuut."*

De werkelijke cijfers: **60 minuten → 5 minuten per product** (niet per batch,
en niet 1 minuut).

### Oplossing
Corrigeer de tekst zodat die overeenkomt met de werkelijke pilotresultaten:
- Tijdsduur voor: ~60 minuten per product
- Tijdsduur na: ~5 minuten per product
- Tijdsbesparing: ~92% (niet 98%)

Pas ook het percentage aan in de resultatenkaart als dat op "98%" staat.

---

## Prioriteitsvolgorde voor implementatie

| # | Verbetering | Reden |
|---|---|---|
| 1 | Verwijder social proof | Actief credibiliteitsrisico — nu fixen |
| 2 | Herstel pilot-case cijfers | Integriteit van de enige echte case |
| 3 | Vervang hero headline | Big Idea is het fundament van alle marketing |
| 4 | Voeg Godfather Offer sectie toe | Conversieverbetering voor warme leads |
| 5 | Voeg intake-vragenlijst toe | Kwalificatie voor het gesprek |
