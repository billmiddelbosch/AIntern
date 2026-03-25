# Problemen & Oplossingen — Specification

## Overview
De derde sectie van de AIntern landingspagina. Toont drie concrete MKB-pijnpunten
en plaatst per pijnpunt de bijbehorende AI-aanpak van AIntern ernaast. De sectie
bouwt emotionele herkenning op ("dit herken ik") en koppelt direct het specifieke
antwoord. Donkere achtergrond (slate-900) voor visueel contrast met de lichte
"Hoe werkt het?"-sectie eronder.

## Problem Being Solved
MKB-ondernemers weten niet precies hoe AI hun specifieke knelpunten oplost. Door
pijnpunten expliciet te benoemen én direct te koppelen aan de concrete aanpak van
AIntern, wordt de abstracte belofte uit de hero concreet en herkenbaar.

## User Stories
- Als bezoeker wil ik mijn eigen pijnpunten terugzien, zodat ik begrijp dat AIntern
  mijn situatie kent.
- Als bezoeker wil ik per pijnpunt de oplossing zien, zodat ik een concreet beeld
  krijg van wat AIntern doet.
- Als bezoeker wil ik de sectie in mijn eigen taal lezen (NL/EN).

## Acceptance Criteria
- [ ] Sectie toont exact drie probleem-oplossing paren
- [ ] Elk paar heeft: probleemtitel, probleembeschrijving, oplossingstitel, oplossingsbeschrijving
- [ ] Elk paar heeft een icoon voor probleem én een icoon voor oplossing
- [ ] Layout is alternating: oneven rijen → probleem links/oplossing rechts; even rijen → gespiegeld (op desktop)
- [ ] Op mobiel: volledig verticaal gestapeld (probleem boven oplossing)
- [ ] Volledig tweetalig NL/EN via vue-i18n (titels, labels) + inline locale data (beschrijvingen)
- [ ] Sectiebrede donkere achtergrond (slate-900), consistent met design system
- [ ] Section id="problemen-oplossingen" aanwezig voor anchor-navigatie
- [ ] Geen CTA in deze sectie — enkel informatief

## UI Requirements
- Donkere achtergrond: `#0f172a` (slate-900)
- Sectieheader: eyebrow-label + H2 titel (Space Grotesk, wit)
- Per pair: twee kaarten naast elkaar — probleemkaart (rood-tint) en oplossingskaart (groen-tint)
- Probleemkaart: rode icoonbadge, rode accentkleur, pijnpunt-tekst
- Oplossingskaart: groene/indigo icoonbadge, oplossings-tekst
- Verbindingspijl of scheidingselement tussen de twee kaarten
- Alternating layout per rij (eerste rij: probleem-links; tweede rij: oplossing-links) op desktop
- Mobiel: probleem boven, oplossing onder, per paar

## Component Tree
```
ProbleemOplossingSectionView.vue       [PAGE wrapper — views/sections/]
└── ProbleemOplossingSection.vue       [ORGANISM — components/sections/problemen-oplossingen/]
    ├── ProbleemOplossingPair.vue      [MOLECULE — components/sections/problemen-oplossingen/]
    │   ├── ProbleemCard.vue           [MOLECULE — components/sections/problemen-oplossingen/]
    │   └── OplossingCard.vue          [MOLECULE — components/sections/problemen-oplossingen/]
```

## Props

### ProbleemOplossingSection.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| pairs | ProbleemOplossingPair[] | yes | Array van drie probleem-oplossing paren |

### ProbleemOplossingPair.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| pair | ProbleemOplossingPair | yes | Eén probleem-oplossing paar |
| index | number | yes | Rijindex voor alternating layout |

### ProbleemCard.vue / OplossingCard.vue
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | yes | Kaartitel (uit locale data) |
| description | string | yes | Kaartbeschrijving (uit locale data) |
| icon | string | yes | Icon-naam |
| variant | 'problem' \| 'solution' | yes | Bepaalt kleurschema |

## State
- Geen store-state — alle data is statisch JSON geladen in de View
- Locale-bewuste rendering via `useI18n()` en inline `nl`/`en` velden in data

## Composables Used
- `useI18n()` — voor section-label, H2-titel en kaart-type-labels

## i18n Keys

### en.json additions
```json
"problemsSolutions": {
  "sectionLabel": "Problems & Solutions",
  "title": "We know your challenges",
  "problemLabel": "Challenge",
  "solutionLabel": "Our approach"
}
```

### nl.json additions
```json
"problemsSolutions": {
  "sectionLabel": "Problemen & Oplossingen",
  "title": "We kennen jouw uitdagingen",
  "problemLabel": "Uitdaging",
  "solutionLabel": "Onze aanpak"
}
```

## Configuration
- shell: true (sectie wordt door AppShell omsloten via HomeView)

## Atomic Level Assignment
- **ProbleemOplossingSection**: ORGANISM — composeert meerdere Molecules tot een complete pagina-sectie
- **ProbleemOplossingPair**: MOLECULE — combineert twee Card-molecules tot een inhoudelijke eenheid
- **ProbleemCard / OplossingCard**: MOLECULE — combineert icoon, label, titel en tekst tot een semantische eenheid

## Implementation Notes
- `ProbleemOplossingCard.vue` handles both problem and solution variants via `variant` prop and scoped CSS
- Icon SVG paths are inlined (same pattern as HowItWorksSection)
- Alternating layout uses CSS `direction: rtl` trick on the pair wrapper — safe because all child elements re-apply `direction: ltr`
- Dark background (#0f172a = slate-900) provides strong visual contrast following the Hero (dark) → HowItWorks (light) → ProbleemOplossingen (dark) rhythm
- Stale `e2e/home.spec.ts` was updated to match current app state (counter UI removed in earlier sprint)

## Last Updated
2026-03-25 — Initiële spec voor L-02; geïmplementeerd en alle tests groen
