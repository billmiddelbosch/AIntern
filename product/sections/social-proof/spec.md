# L-10 — Social Proof / Testimonials Section

**Backlog ID:** L-10
**Owner:** CTO (Morgan) — implementation; CEO (Alex) — copy approval
**Effort:** M
**Spec requested by:** Human Board 2026-04-18
**Depends on:** L-03 (Resultaten & Cases — existing), L-02 (Problemen & Oplossingen — existing)

---

## Overview

The landing page currently lacks third-party validation. Visitors from LinkedIn who land on the homepage see AIntern's own claims about time savings and ROI — but no external evidence. This section adds a Social Proof block that shows:

1. Client testimonials (quotes from real or representative pilot clients)
2. Optionally: company/logo strip if clients permit branding use
3. A trust-reinforcing statistic row (e.g. "60 → 5 min per product")

The section sits **between the Resultaten & Cases section and the No-Cure-No-Pay / FAQ section** in the homepage scroll order — after the visitor has seen the problem and solution framing, and before they encounter the risk-removal offer.

---

## Target Audience

Lightspeed webshop owners and MKB founders considering AI automation. They are sceptical of vendor claims and respond to peer validation ("someone like me already did this and it worked").

---

## Content Design

### Testimonial Cards

Each card contains:
- **Quote** — 2–3 sentences max. Direct, specific, Dutch. No buzzwords.
- **Name + role** — real or composite (e.g. "Eigenaar, sportwebshop — 120 producten/maand")
- **Result metric** — one concrete number (e.g. "Productinvoer nu 5× sneller")
- **Avatar** — initials-based avatar (no photos required for v1)

**Minimum viable:** 2 testimonial cards. Ideal: 3.

**Copy guidance (for CEO to provide or approve):**
- Quotes must be specific to a task or workflow — not generic praise
- Each quote should mention a concrete pain that was solved
- Tone: factual, slightly surprised/relieved — the way a pragmatic business owner talks

**Placeholder quotes (to be replaced by real client quotes before launch):**

> "We hadden 3 uur per week kwijt aan het bijwerken van productomschrijvingen. Nu doet de AI dat in 20 minuten. Ik had niet verwacht dat het zo snel zou werken."
> — Sandra V., eigenaar webshop tuinartikelen

> "Ik was sceptisch, maar ze leverden echt wat ze beloofden. Na twee weken draait de automatisering en hoef ik er nauwelijks naar om te kijken."
> — Mark B., Lightspeed webshop 180 SKUs

> "No-cure-no-pay klinkt te mooi om waar te zijn, maar het werkt. We hebben nu twee processen geautomatiseerd die ik al jaren handmatig deed."
> — Anke R., eigenaar modewebshop

### Trust Stats Row (optional, above or below cards)

A compact horizontal strip with 2–3 key numbers:

| Stat | Label |
|---|---|
| 60 → 5 min | Productinvoer per product |
| 2 weken | Gemiddelde implementatietijd |
| No cure, no pay | Betaal alleen bij resultaat |

This strip can be rendered as a simple `flex` row with large numbers and small labels, similar to the metrics pattern in L-03.

---

## Component Architecture

```
HomeView.vue
└── SocialProofSection.vue        [NEW — src/components/sections/]
    ├── TrustStatsRow.vue          [NEW — src/components/sections/] (optional, can be inline)
    └── TestimonialCard.vue        [NEW — src/components/sections/]
```

### `SocialProofSection.vue`

- Receives `testimonials: Testimonial[]` and `stats: TrustStat[]` as props, or defines them inline as static data
- Renders the section heading, trust stats row, and testimonial card grid
- Uses `useIntersectionObserver` (VueUse) for a fade-in entrance animation consistent with other sections

### `TestimonialCard.vue`

Props:
```typescript
interface Testimonial {
  quote: string
  name: string
  role: string
  resultMetric: string
  initials: string          // e.g. 'SV' — for avatar
  avatarColor: string       // Tailwind bg class — e.g. 'bg-indigo-100'
}
```

### `TrustStatsRow.vue` (or inline in SocialProofSection)

Props:
```typescript
interface TrustStat {
  value: string   // e.g. '60 → 5 min'
  label: string   // e.g. 'Productinvoer per product'
}
```

---

## Visual Design

### Layout

- **Section background:** `bg-slate-50` — slightly off-white to visually separate from adjacent white sections
- **Section padding:** consistent with other landing page sections (`py-20 px-6`)
- **Section heading:** `"Wat onze klanten zeggen"` (or `"Resultaten in de praktijk"` — CEO decides)
- **Card grid:** `grid grid-cols-1 md:grid-cols-3 gap-6`
- **Card style:** white background, rounded-2xl, subtle shadow, left accent border in indigo

### Testimonial Card

```
┌─────────────────────────────┐
│  ❝ Quote tekst hier...     │
│    ...maximaal 3 zinnen.   │
│                             │
│  ○ SV   Sandra V.          │
│         Eigenaar tuinwebshop│
│                             │
│  📈 Productinvoer 5× sneller│
└─────────────────────────────┘
```

- Quote in `text-slate-700`, italic
- Avatar: 32px circle with initials
- Name bold, role in `text-slate-500`
- Result metric highlighted in `text-indigo-700 font-semibold`

### Trust Stats Row (if included)

Horizontal flex row, centered, `gap-12`. Each stat:
- Large number/value: `text-3xl font-bold text-indigo-700`
- Label below: `text-sm text-slate-500`

---

## i18n

Add keys to `en.json` and `nl.json`:

```json
"socialProof": {
  "heading": "Wat onze klanten zeggen",
  "subheading": "Lightspeed-webshops die al resultaat zien",
  "testimonials": [...],
  "stats": [...]
}
```

Static testimonial content may be hardcoded in the component for v1 if i18n of long quotes is too verbose — CEO decides.

---

## Placement in HomeView.vue

Insert `<SocialProofSection />` after `<ResultatenSection />` and before `<NoCureNoPayFaqSection />`.

---

## Acceptance Criteria

- [ ] Section visible on homepage between Resultaten & Cases and No-Cure-No-Pay
- [ ] Minimum 2 testimonial cards rendered (3 preferred)
- [ ] Each card shows: quote, name, role, result metric, initials avatar
- [ ] Trust stats row present with at least 2 stats
- [ ] Section uses fade-in entrance animation (VueUse `useIntersectionObserver`)
- [ ] Responsive: cards stack to single column on mobile (< md breakpoint)
- [ ] i18n keys added for heading and subheading (static quote content may be hardcoded)
- [ ] `npm run type-check` passes
- [ ] No placeholder copy in production — CEO must approve final quotes before deploy

---

## Out of Scope (v1)

- CMS-driven testimonials (hardcoded static data for v1)
- Star ratings or NPS scores
- Video testimonials
- External review platform embeds (Trustpilot, Google Reviews)
- Client logo strip (requires explicit client permission — future backlog item)
- A/B testing of testimonial variants

---

## Open Questions (CEO to resolve before implementation)

1. **Real vs. placeholder quotes:** Do we have real client quotes ready, or do we launch with placeholder copy initially?
2. **Section heading:** "Wat onze klanten zeggen" or "Resultaten in de praktijk"?
3. **Trust stats:** Include the stats row, or keep it testimonials-only?
4. **Client logo strip:** Any clients willing to have their logo/name shown publicly? If yes, this unlocks L-10b.

---

## Decisions Log

_To be filled by CEO before implementation starts._
