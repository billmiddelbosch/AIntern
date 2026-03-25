# Resultaten & Cases — Specification

## Atomic Level
ORGANISM

## Atomic Rationale
ResultatenCasesSection composeert meerdere ResultaatCard Molecules (elk met metric badge, tag, titel, beschrijving) in een grid-layout tot een complete, autonome pagina-sectie. De sectie zelf heeft geen props nodig buiten de data-injection van de View.

## Overview
De vierde sectie van de AIntern landingspagina. Toont vier concrete, kwantificeerbare
resultaten die AIntern voor MKB-klanten heeft behaald. Elk resultaat heeft een grote
metric (bijv. "70%"), een categorie-tag (bijv. "Tijdsbesparing"), een korte titel en
een beschrijvende zin. De lichte achtergrond (#f8fafc / slate-50) zorgt voor het
visuele ritme: donker (Hero) → licht (HowItWorks) → donker (ProbleemOplossing) → licht (Resultaten).

## Problem Being Solved
Na de Problemen & Oplossingen sectie heeft de bezoeker begrepen *dat* AIntern helpt.
De Resultaten & Cases sectie beantwoordt de vraag: *hoeveel* helpt het concreet? Door
meetbare resultaten te tonen neemt social proof toe en wordt de CTA geloofwaardiger.

## User Stories
- Als bezoeker wil ik concrete cijfers zien zodat ik geloof dat AIntern écht resultaat boekt.
- Als bezoeker wil ik per resultaat een korte context zien zodat ik begrijp bij wat voor type bedrijf/proces dit geldt.
- Als bezoeker wil ik de sectie in mijn eigen taal (NL/EN) lezen.

## Acceptance Criteria
- [ ] Sectie toont exact vier resultaat-kaarten
- [ ] Elke kaart heeft: een grote metric (getal + eenheid), een categorie-tag, een titel en een beschrijving
- [ ] Categorie-tags zijn visueel gedifferentieerd per type (tijdsbesparing, kostenbesparing, groei, kwaliteit)
- [ ] Kaarten worden getoond in een 2×2 grid op desktop, 1-kolom op mobiel
- [ ] Sectie heeft een eyebrow-label + H2 titel
- [ ] Volledig tweetalig NL/EN: section-labels via vue-i18n, card content via inline locale data
- [ ] Lichte achtergrond (#f8fafc) voor visueel contrast na de donkere ProbleemOplossingen-sectie
- [ ] Section id="resultaten-cases" aanwezig voor anchor-navigatie
- [ ] Geen CTA in deze sectie — enkel social proof

## UI Requirements
- Achtergrond: `#f8fafc` (slate-50) — licht, consistent met HowItWorks-sectie
- Sectieheader: eyebrow-label + H2 (Space Grotesk, slate-900), centered
- Metric: groot (3rem+), bold, indigo-600 — de eyecatcher van elke kaart
- Tag: klein pill-badge met kleurcodering per categorie
  - tijdsbesparing: indigo/blue tint
  - kostenbesparing: emerald/green tint
  - groei: amber/orange tint
  - kwaliteit: violet/purple tint
- Kaart: witte achtergrond, lichte border, zachte schaduw, hover lift
- Grid: 2×2 op desktop (≥768px), 1×4 op mobiel
- Subtiele animated number of static bold metric — geen animatie vereist (static is safe)

## Component Tree
```
ResultatenCasesSectionView.vue         [PAGE wrapper — views/sections/]
└── ResultatenCasesSection.vue         [ORGANISM — components/sections/resultaten-cases/]
    └── ResultaatCard.vue              [MOLECULE — components/sections/resultaten-cases/]
```

## Props

### ResultatenCasesSection.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| cases | ResultaatCase[] | yes | Array van vier resultaat-cases |

### ResultaatCard.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| case | ResultaatCase | yes | Eén resultaat-case |

## Emits
Geen — beide componenten zijn puur presentationeel.

## Slots
Geen.

## State
- Geen store-state — alle data is statisch JSON geladen in de View
- Locale-bewuste rendering via `useI18n()` en inline `nl`/`en` velden in data

## Composables Used
- `useI18n()` — voor section-label, H2-titel, en tag-labels in ResultatenCasesSection

## i18n Keys

### en.json additions
```json
"resultatenCases": {
  "sectionLabel": "Results & Cases",
  "title": "Real results for real businesses",
  "tagTimeSaving": "Time saving",
  "tagCostSaving": "Cost saving",
  "tagGrowth": "Growth",
  "tagQuality": "Quality"
}
```

### nl.json additions
```json
"resultatenCases": {
  "sectionLabel": "Resultaten & Cases",
  "title": "Echte resultaten voor echte bedrijven",
  "tagTimeSaving": "Tijdsbesparing",
  "tagCostSaving": "Kostenbesparing",
  "tagGrowth": "Groei",
  "tagQuality": "Kwaliteit"
}
```

## Data Model
See `types.ts` and `data.json` in this directory.

## Configuration
- shell: true (sectie wordt door AppShell omsloten via HomeView)

## Implementation Notes
- Icon SVG paths inlined in ResultaatCard (same pattern as ProbleemOplossingCard and HowItWorksSection)
- Colour variants driven by `tag` prop via BEM modifier class (`.rc-card--{tag}`) — CSS-only, no JS branching
- `metricUnit` rendered conditionally with `v-if` — groei case has empty string unit, hides the element
- Locale content resolved by `getLocaleContent(c)` computed helper, same pattern as HowItWorks
- `MessageSchema` in i18n.ts auto-updates because it is `typeof en` — no manual schema edits needed
- Background (#f8fafc) mirrors HowItWorks for the correct dark→light→dark→light page rhythm
- `cases` prop name (lowercase) chosen to avoid collision with reserved `case` keyword in JS/TS

## Last Updated
2026-03-25 — Implemented, all unit tests (18) and E2E tests (10) green
