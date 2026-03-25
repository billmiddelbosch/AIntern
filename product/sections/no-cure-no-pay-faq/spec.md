# No-Cure-No-Pay & FAQ — Specification

## Atomic Level
ORGANISM

## Atomic Rationale
NoCureNoPayFaqSection composeert een NoCureNoPayProposition Molecule (garantiestatement, drie kernpunten, CTA) en meerdere FaqAccordionItem Molecules (vraag + uitklapbaar antwoord) in een complete, autonome pagina-sectie. De sectie heeft geen store-afhankelijkheden — alleen locale data injection vanuit de View en lokale UI-state voor de accordion.

## Overview
De vijfde sectie van de AIntern landingspagina. Bouwt vertrouwen op door het no-cure-no-pay model prominent uit te leggen en zes veelgestelde bezwaren proactief te beantwoorden via een interactieve accordion. De donkere achtergrond (slate-900) zorgt voor het juiste visuele ritme: licht (Resultaten) → donker (NoCureNoPayFaq) → licht (OverAIntern, komend).

## Problem Being Solved
Na de Resultaten & Cases sectie weet de bezoeker dat AIntern resultaat boekt. Maar vragen als "wat als het niet werkt?", "moet ik technische kennis hebben?" en "is mijn data veilig?" zijn nog onbeantwoord. Deze sectie neemt die resterende drempels weg vóór de finale CTA.

## User Stories
- Als bezoeker wil ik begrijpen wat no-cure-no-pay concreet inhoudt zodat ik het risico kan inschatten.
- Als bezoeker wil ik een antwoord vinden op mijn specifieke bezwaar zodat ik een weloverwogen beslissing kan maken.
- Als bezoeker wil ik de accordion intuïtief kunnen bedienen (één item tegelijk open) zodat ik snel scan zonder overweldigd te worden.
- Als bezoeker wil ik de sectie in mijn eigen taal (NL/EN) lezen.

## Acceptance Criteria
- [ ] Sectie toont een prominente propositie-blok met: garantiestatement, drie kernpunten (geen risico, meetbaar resultaat, gratis start) en een CTA-knop "Gratis kennismaking"
- [ ] Sectie toont exact zes FAQ-items in een accordion
- [ ] Accordion is exclusief: slechts één item tegelijk open
- [ ] Het eerste FAQ-item is standaard open bij laden van de pagina
- [ ] Elk accordion-item toont een chevron-icoon dat draait (180°) wanneer het open is
- [ ] Klikken op een open item sluit het (toggle)
- [ ] Klikken op een gesloten item opent het en sluit het vorige open item
- [ ] Sectie heeft een eyebrow-label + H2 titel
- [ ] Volledig tweetalig NL/EN: section-labels via vue-i18n, FAQ-content via inline locale data
- [ ] Donkere achtergrond (slate-900 / #0f172a) voor visueel contrast na de lichte Resultaten-sectie
- [ ] Section id="no-cure-no-pay" aanwezig voor anchor-navigatie
- [ ] CTA-knop linkt naar #contact anchor (toekomstige sectie)
- [ ] Accordion open/dicht animatie is smooth (CSS max-height transitie)

## UI Requirements
- Achtergrond: `#0f172a` (slate-900) — donker, mirrors ProbleemOplossing sectie
- Subtiele radial glow achtergrond (indigo tint, mirrors ProbleemOplossing patroon)
- Sectieheader: eyebrow-label + H2 (Space Grotesk, slate-100), centered
- Layout: twee-koloms op desktop (≥1024px) — propositie links, accordion rechts; één kolom op mobiel
- Propositie-blok:
  - Garantiestatement badge: indigo pill met schildicoon
  - H3 subkop (wit)
  - Drie kernpunten als icon-lijst (check iconen, indigo-400)
  - CTA knop (indigo filled, wit tekst)
- Accordion:
  - Witte/semi-transparante kaart achtergrond (wit met 5% opacity, of slate-800)
  - Vraag: semibold, slate-100
  - Antwoord: slate-400, regular weight, max-height transitie
  - Chevron-icoon: rotatieanimatie 0° → 180° bij openen
  - Hover state op gesloten items
  - Open item: lichte indigo linkerborder als visuele indicator

## Component Tree
```
NoCureNoPayFaqSectionView.vue            [PAGE wrapper — views/sections/]
└── NoCureNoPayFaqSection.vue            [ORGANISM — components/sections/no-cure-no-pay-faq/]
    ├── NoCureNoPayProposition.vue        [MOLECULE — components/sections/no-cure-no-pay-faq/]
    └── FaqAccordionItem.vue             [MOLECULE — components/sections/no-cure-no-pay-faq/]
```

## Props

### NoCureNoPayFaqSection.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| faqs | FaqItem[] | yes | Array van zes FAQ-items |

### NoCureNoPayProposition.vue
Geen props — alle content via i18n keys.

### FaqAccordionItem.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| faq | FaqItem | yes | Eén FAQ-item met tweetalige vraag/antwoord |
| isOpen | boolean | yes | Of dit item momenteel open is |

## Emits

### FaqAccordionItem.vue
| Event | Payload | Description |
|-------|---------|-------------|
| toggle | void | Gebruiker klikt op het item — parent beslist of het opent/sluit |

## Slots
Geen.

## State
- `openIndex: Ref<number>` — lokale state in NoCureNoPayFaqSection die bijhoudt welk item open is (index in faqs array, -1 = geen)
- Initieel: `openIndex = 0` (eerste item open)
- Geen Pinia store nodig

## Composables Used
- `useI18n()` — voor section-label, H2-titel, propositie-teksten en CTA-label in NoCureNoPayFaqSection en NoCureNoPayProposition

## i18n Keys

### en.json additions
```json
"noCureNoPay": {
  "sectionLabel": "No-Cure-No-Pay",
  "title": "You only pay when it works",
  "proposition": {
    "badge": "Guaranteed results",
    "heading": "No risk. No upfront investment. Just results.",
    "point1": "Free process analysis — no commitment",
    "point2": "You define the success criteria together with us",
    "point3": "Pay only after verified, measurable results",
    "cta": "Free consultation"
  },
  "faqTitle": "Frequently asked questions"
}
```

### nl.json additions
```json
"noCureNoPay": {
  "sectionLabel": "No-Cure-No-Pay",
  "title": "Je betaalt alleen als het werkt",
  "proposition": {
    "badge": "Gegarandeerd resultaat",
    "heading": "Geen risico. Geen voorinvestering. Wel resultaat.",
    "point1": "Gratis procesanalyse — vrijblijvend",
    "point2": "Jij bepaalt de succescriteria samen met ons",
    "point3": "Betalen pas na bewezen, meetbaar resultaat",
    "cta": "Gratis kennismaking"
  },
  "faqTitle": "Veelgestelde vragen"
}
```

## Data Model
See `types.ts` and `data.json` in this directory.

## Configuration
- shell: true (sectie wordt door AppShell omsloten via HomeView)

## Implementation Notes
- Accordion state is puur lokaal (`ref<number>`) in de organism — geen Pinia nodig
- `openIndex` default = 0 zodat het eerste item open is bij laden
- Toggle logica: als `openIndex === clickedIndex` → sluit (set -1), anders → open (set clickedIndex)
- FaqAccordionItem gebruikt CSS `max-height` transitie voor smooth open/dicht animatie
- Chevron rotatie via CSS transform (`rotate(180deg)`) met transition op de `.ncnp-faq__chevron` class
- Locale content resolved door `locale.value === 'nl' ? faq.nl : faq.en` patroon (zelfde als ResultaatCard)
- NoCureNoPayProposition heeft geen props — alle tekst via i18n (geen locale-data nodig, content is UX copy niet case data)
- CTA linkt naar `#contact` (anchor navigatie naar toekomstige sectie 6)
- CSS BEM prefix: `ncnp-` voor alle classes in deze sectie
- Background mirrors ProbleemOplossing (#0f172a) voor donker/licht ritme

## Last Updated
2026-03-25 — Implementation complete
