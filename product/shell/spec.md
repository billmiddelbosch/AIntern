# Application Shell Specification

## Overview
AIntern is a single-page landing page. The shell consists of a sticky top navigation bar and a footer. All sections are anchored on one page — navigation links use smooth scroll to jump to the relevant section.

## Navigation Structure
- **Over AIntern** → `#over-aintern`
- **No-Cure-No-Pay** → `#no-cure-no-pay`
- **Contact** → `#contact`
- **NL / EN** → Language toggle (in nav, right side)
- **Gratis kennismaking** → CTA button → `#contact`

## Layout Pattern
Sticky top navigation (64px height) with logo on the left, nav links centered, and language toggle + CTA button on the right. Below the nav, sections stack vertically as a single-page layout.

## Responsive Behavior
- **Desktop (≥1024px):** Full horizontal nav with all items visible
- **Tablet (768–1023px):** Nav items hidden, hamburger menu opens a full-width dropdown
- **Mobile (<768px):** Hamburger menu, CTA button visible in mobile menu

## Footer
Logo + tagline, nav links (same as header), language toggle, copyright line.

---

## Admin Shell

Separate layout behind `/admin` — no public footer or marketing nav.

### Layout Pattern
Fixed left sidebar (256px / `w-64`) + scrollable main area. Header 64px tall with page title (from `route.meta.title`) and logout button.

### Admin Navigation Structure
- **Dashboard** → `/admin`
- **KPI Dashboard** → `/admin/kpi`
- **Kennisbank** → `/admin/kennisbank`
- **LinkedIn Posts** → `/admin/linkedin`
- **Pipeline** → `/admin/leads`
- **Onboarding** → `/admin/onboarding`
- **Groei Systeem** → `/admin/groei-systeem`
- **Organisatie** → `/admin/organisation`
- **AInternLoop** → `/admin/ainternloop` _(agent orkestratie: issues / agents / acties)_
- **Nieuws** → `/admin/nieuws` _(NewsFlow flywheel: agents / pagina's / acties)_

### Active State
`active-class="bg-indigo-50 text-indigo-600"` via Vue Router `RouterLink`.

### Responsive Behavior
Admin is desktop-only for now; no mobile breakpoint designed yet.

## Design Tokens Applied
- Primary color: indigo (CTA button, active nav state, hover accents)
- Secondary color: violet (subtle highlights)
- Neutral color: slate (text, backgrounds, borders)
- Heading font: Space Grotesk
- Body font: Inter
