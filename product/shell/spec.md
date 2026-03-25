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

## Design Tokens Applied
- Primary color: indigo (CTA button, active nav state, hover accents)
- Secondary color: violet (subtle highlights)
- Neutral color: slate (text, backgrounds, borders)
- Heading font: Space Grotesk
- Body font: Inter
