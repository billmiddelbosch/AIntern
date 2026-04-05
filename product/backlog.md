# Product Backlog — AIntern

## Landing Page (L)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| ~~L-02~~ | ~~**Problemen & Oplossingen**~~ | M | ~~Drie MKB-pijnpunten vertaald naar concrete AI-aanpak van AIntern. Roadmap section 3.~~ Geïmplementeerd 2026-03-25. |
| ~~L-03~~ | ~~**Resultaten & Cases**~~ | M | ~~Kwantificeerbare voorbeelden van tijds- en kostenbesparing door AI-inzet. Roadmap section 4.~~ Geimplementeerd 2026-03-25. |
| ~~L-04~~ | ~~**No-Cure-No-Pay & FAQ**~~ | M | ~~Risicovrij businessmodel uitgelegd met veelgestelde bezwaren proactief weggenomen. Roadmap section 5.~~ In progress 2026-03-25. |
| ~~L-05~~ | ~~**Over AIntern & Contact**~~ | S | ~~Verhaal, visie en CTA om een vrijblijvend kennismakingsgesprek in te plannen. Roadmap section 6.~~ Geimplementeerd 2026-03-31. |
| ~~L-06~~ | ~~**SEO & Meta Tags**~~ | S | ~~Page title, meta description, Open Graph tags, and canonical URLs for all routes.~~ Geimplementeerd 2026-03-30. |
| ~~L-07~~ | ~~**Analytics Integration**~~ | S | ~~Google Analytics or Plausible integration; track page views and CTA clicks.~~ Geimplementeerd 2026-03-30. |
| ~~L-08~~ | ~~**Contact Form / Calendly Booking Widget**~~ | M | ~~Embedded Calendly widget or custom form to schedule a no-obligation intro call.~~ Geimplementeerd 2026-03-28. |
| ~~L-09~~ | ~~**Cookie Consent Banner (GDPR)**~~ | S | ~~Consent banner required before loading analytics; stores preference in localStorage.~~ Geimplementeerd 2026-03-30. |
| **L-14** | **Marketing Alignment — Website verbeteringen obv go-to-market strategie** | M | 5 verbeteringen gebaseerd op GTM-sessie 2026-04-01. Spec: `product/sections/marketing-alignment/spec.md`. Volgorde: (1) verwijder onjuiste social proof claim, (2) herstel pilot-case cijfers, (3) vervang hero headline door Big Idea, (4) voeg Godfather Offer sectie toe, (5) voeg intake-vragenlijst toe vóór book-a-call. Uitvoeren vóór eerste LinkedIn post en outreach. |
| L-10 | **Social Proof / Testimonials Section** | M | Client quotes or logos to build trust. Ties into Resultaten & Cases narrative. |
| ~~L-11~~ | ~~**Blog / Kennisbank stub**~~ | M | ~~Placeholder section or route for future knowledge-base articles; improves SEO.~~ Geïmplementeerd 2026-04-02. |
| L-12 | **AI Interaction Panel** | L | Direct in-page interaction with the AI intern — chat interface or task demo widget. |
| L-13 | **Animations of Previous Assignments / Portfolio** | M | Animated showcase of past AI-intern work; visual portfolio to demonstrate capability. |

## UX & Accessibility (U)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| U-01 | **Skip-to-content & ARIA Landmarks** | S | Accessibility baseline: skip link and proper landmark roles across all pages. |
| U-02 | **Mobile Navigation / Hamburger Menu** | S | Responsive nav for small screens; animated open/close using VueUse. |
| U-03 | **Scroll-triggered Entrance Animations (VueUse)** | S | Fade/slide-in on scroll using useIntersectionObserver from VueUse. |
| U-04 | **Animated IAgent Brand Icon** | S | Introduce an animated version of the IAgent brand icon for hero or navbar use. |

## Technical & Infrastructure (I)

| ID | Feature | Effort | Notes |
|---|---|---|---|
| ~~I-03~~ | ~~**Sitemap & robots.txt**~~ | S | ~~Static sitemap.xml and robots.txt for crawler discoverability; pairs with L-06 SEO work.~~ Geïmplementeerd 2026-04-02. |
| I-04 | **Serverless Contact Form Backend** | M | Replace Formspree with a serverless function (e.g. Vercel/Netlify function) that sends email server-side. Destination email stored in a server-only env var — never exposed to the client bundle. Current Formspree setup is the temporary solution. |
| I-05 | **Collect real email address in intake flow** | S | Email was removed from the 5-step intake form but the Lambda still requires it (currently using a dummy value `test@aintern.nl`). Add email collection back — either as a step in the intake modal or derive it from the Calendly webhook after booking. Required for DynamoDB GSI lookup and meeting confirmation. |
