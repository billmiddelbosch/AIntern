# Over AIntern & Contact — Specification

## Atomic Level
ORGANISM

## Atomic Rationale
OverAInternContactSection is een zelfstandige pagina-sectie die alle content inline rendert via i18n — geen child-molecules nodig. De sectie combineert een story/vision blok (links) met een prominente CTA-kaart (rechts) in één autonome, visueel complete eenheid. Geen store-afhankelijkheden.

## Overview
De zesde en laatste sectie van de AIntern landingspagina. Vertelt het AIntern-verhaal, communiceert de visie en biedt de finale CTA om een gratis kennismakingsgesprek in te plannen. Draagt het `id="contact"` anchor waarop de NoCureNoPayFaq CTA-knop navigeert. Lichte achtergrond (slate-50) sluit het donker/licht ritme af na de donkere NoCureNoPayFaq-sectie.

## Problem Being Solved
Na de NoCureNoPayFaq-sectie weet de bezoeker wat AIntern doet en dat het risicovrij is. Wat ontbreekt is het menselijke verhaal achter het bedrijf en een duidelijke, lage drempel om contact te leggen. Deze sectie vult dat gat: wie zijn we, waarom doen we dit, en hoe neem je nu de volgende stap?

## User Stories
- Als bezoeker wil ik begrijpen wie AIntern is en waarom ze dit doen, zodat ik vertrouwen krijg in het bedrijf.
- Als bezoeker wil ik de visie van AIntern kennen zodat ik weet of onze doelen overeenkomen.
- Als bezoeker wil ik eenvoudig een kennismakingsgesprek kunnen boeken of mailen zodat ik zonder moeite contact kan leggen.
- Als bezoeker wil ik de sectie in mijn eigen taal (NL/EN) lezen.

## Acceptance Criteria
- [ ] Sectie heeft `id="contact"` anchor voor navigatie vanuit NoCureNoPayFaq CTA
- [ ] Sectie toont een eyebrow-label + H2 titel
- [ ] Linkerkolom: "Ons verhaal" subkop + twee paragrafen
- [ ] Linkerkolom: "Onze visie" subkop + visiestatement in gestylede pull-quote (indigo linkerborder, italic)
- [ ] Rechterkolom: prominente CTA-kaart met indigo gradient achtergrond
- [ ] CTA-kaart: decoratief icoon bovenaan
- [ ] CTA-kaart: heading + subtext
- [ ] CTA-kaart: primaire knop (wit, indigo tekst) — "Gratis kennismakingsgesprek"
- [ ] CTA-kaart: secundaire e-mail link (semi-transparant wit)
- [ ] Twee-koloms layout op desktop (≥1024px), één kolom op mobiel
- [ ] Lichte achtergrond (#f8fafc, slate-50) met subtiel dot-patroon (mirrors ResultatenCases)
- [ ] Volledig tweetalig NL/EN via vue-i18n
- [ ] Geen Tailwind-klassen in template — pure scoped CSS met BEM prefix `oac-`

## UI Requirements
- Achtergrond: `#f8fafc` (slate-50) — licht, na donkere NoCureNoPayFaq sectie
- Subtiel dot-patroon: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`, `background-size: 2rem 2rem`, `opacity: 0.45`
- Padding: 6rem 1rem desktop, 4rem 1rem mobiel
- Max-width container: 72rem, gecentreerd
- Linkerkolom:
  - Eyebrow + H2 (Space Grotesk, slate-900)
  - Subkopjes H3 (slate-900, semibold)
  - Paragrafen: slate-600, 1.125rem
  - Pull-quote: indigo-600 linkerborder (4px), italic, iets groter (1.125rem), slate-700
- Rechterkolom:
  - Kaart: `linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)`
  - Rounded-2xl (`border-radius: 1.5rem`), ruime padding (2.5rem)
  - Decoratief icoon bovenaan (shield/sparkle SVG, wit)
  - Heading: wit, 1.5rem, semibold
  - Subtext: wit met 80% opacity, 1rem
  - Primaire knop: wit pill, indigo tekst, hover: licht indigo tint
  - Secundaire link: wit 70% opacity, hover: volledig wit
- CSS BEM prefix: `oac-`

## Component Tree
```
OverAInternContactSectionView.vue        [VIEW — src/views/sections/]
└── OverAInternContactSection.vue        [ORGANISM — src/components/sections/over-aintern-contact/]
```

## Props
### OverAInternContactSection.vue
Geen props — alle content via i18n.

## Emits
Geen.

## Slots
Geen.

## State
Geen lokale state, geen Pinia store — puur presentationeel.

## Composables Used
- `useI18n()` — voor alle user-facing strings via `t()`

## i18n Keys

### en.json additions
```json
"overAIntern": {
  "sectionLabel": "About AIntern",
  "title": "AI that works for your business",
  "story": {
    "heading": "Our story",
    "paragraph1": "AIntern was founded with one mission: making powerful AI technology accessible and risk-free for SMEs. Too many business owners were losing time to repetitive tasks that AI could handle — but the barrier to entry felt high.",
    "paragraph2": "We built AIntern to change that. We analyse your processes, implement tailored AI solutions, and only charge you when the results are measurable and verified. No jargon. No large upfront investment. Just results."
  },
  "vision": {
    "heading": "Our vision",
    "text": "Every SME deserves access to the same AI advantages that large corporations enjoy — without the complexity or the risk."
  },
  "contact": {
    "heading": "Ready to get started?",
    "subtext": "Book a free, no-obligation intro call. We analyse your situation, identify the biggest opportunities, and show you exactly what AI can do for your business.",
    "cta": "Book free intro call",
    "or": "or",
    "email": "Send us an email"
  }
}
```

### nl.json additions
```json
"overAIntern": {
  "sectionLabel": "Over AIntern",
  "title": "AI die werkt voor jouw bedrijf",
  "story": {
    "heading": "Ons verhaal",
    "paragraph1": "AIntern is opgericht met één missie: krachtige AI-technologie toegankelijk en risicovrij maken voor het MKB. Te veel ondernemers verloren tijd aan repetitieve taken die AI al lang kan overnemen — maar de drempel voelde hoog.",
    "paragraph2": "Wij bouwden AIntern om dat te veranderen. We analyseren jouw processen, implementeren gerichte AI-oplossingen, en sturen pas een factuur als de resultaten meetbaar en bewezen zijn. Geen jargon. Geen grote voorinvestering. Wel resultaat."
  },
  "vision": {
    "heading": "Onze visie",
    "text": "Elk MKB-bedrijf verdient toegang tot dezelfde AI-voordelen die grote corporaties genieten — zonder de complexiteit of het risico."
  },
  "contact": {
    "heading": "Klaar om te beginnen?",
    "subtext": "Plan een gratis, vrijblijvend kennismakingsgesprek. We analyseren jouw situatie, identificeren de grootste kansen en laten je precies zien wat AI voor jouw bedrijf kan betekenen.",
    "cta": "Gratis kennismakingsgesprek",
    "or": "of",
    "email": "Stuur ons een e-mail"
  }
}
```

## Implementation Notes
- Geen sub-componenten nodig — alles inline in het organism (S-effort)
- Dot-patroon identiek aan ResultatenCases: zelfde CSS `::before` patroon
- CTA-knop linkt via `href="mailto:hello@aintern.nl"` voor de email link
- De primaire CTA-knop kan ook linken naar een Calendly of booking URL (placeholder `#`)
- Section id="contact" is vereist — NoCureNoPayFaq CTA navigeert hiernaartoe
- CSS BEM prefix: `oac-` voor alle classes

## Last Updated
2026-03-25 — Implementation complete
