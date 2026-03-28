# Contact Form & Calendly Booking Widget Specification

**Atomic Level**: Organism (ContactCalendlySection) + Atom (CalendlyWidget)
**Atomic Rationale**: `ContactCalendlySection` is an organism — it owns domain logic (form state via `useContactForm`, env-var config), composes the `CalendlyWidget` atom and form fields, and represents a self-contained page section. `CalendlyWidget` is an atom — it is a pure, project-agnostic iframe wrapper with no composable or store imports, highly reusable across any project.

## Overview
A dedicated, always-visible contact section at the bottom of the landing page (`id="contact"`). Visitors can either schedule a call directly via an inline Calendly booking widget, or send a message through a contact form. This provides a persistent inline engagement point that replaces the modal-triggered CTA flow.

## User Flows
- Visitor scrolls to Contact section (or uses nav anchor link) and sees two side-by-side engagement options
- Left path: Visitor selects a time slot in the Calendly inline embed and books an intro call without leaving the page
- Right path: Visitor fills in name, email, and message fields, submits the form, and receives an inline success confirmation
- On mobile: columns stack vertically — Calendly widget on top, contact form below
- Form submission uses the existing `useContactForm` composable and `VITE_CONTACT_ENDPOINT` env var
- When `VITE_CALENDLY_URL` is not set, the Calendly column shows a placeholder card with a direct link fallback

## UI Requirements
- Dark background (slate-900) for strong visual contrast after the light Over AIntern section
- Centered section header: eyebrow label, h2 title, and subtext paragraph
- Two-column grid layout (equal width columns) with a subtle divider treatment between them
- Left column: Calendly inline embed (driven by `VITE_CALENDLY_URL`); shows placeholder skeleton when env var absent
- Right column: Contact form with name, email, message fields and submit button; inline success and error states
- Both columns use card-style containers with subtle border and dark-variant background (slate-800)
- Form UI conventions match existing ContactModal style (rounded inputs, indigo CTA button)
- Responsive: single column on mobile (< 768 px), two-column grid on tablet and up (≥ 768 px)
- Tweetalig NL/EN via vue-i18n

## Configuration
- shell: true
