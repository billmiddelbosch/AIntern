# Product Roadmap

## Sections

### 1. Hero & Value Proposition
Kernboodschap met concrete AI-resultaten en primaire CTA voor een gratis kennismaking.

### 2. Hoe werkt het?
Visuele stap-voor-stap flow: Analyse → AI-implementatie → Meetbaar resultaat.

### 3. Problemen & Oplossingen ✓ (L-02 — geïmplementeerd 2026-03-25)
Drie MKB-pijnpunten vertaald naar concrete AI-aanpak van AIntern. Twee-koloms layout per probleem: pijnpunt links, oplossing rechts. Visuele iconografie, tweetalig NL/EN.

### 4. Resultaten & Cases (feature/resultaten-cases — implemented 2026-03-25)
Kwantificeerbare voorbeelden van tijds- en kostenbesparing door AI-inzet. Toont vier resultaat-kaarten elk met een grote metric, categorie-tag, titel en beschrijving. Lichte achtergrond voor visueel ritme (donker → licht wisseling). Tweetalig NL/EN, inline locale data per case.

### 5. No-Cure-No-Pay & FAQ (feature/l04-no-cure-no-pay-faq — in progress 2026-03-25)
Risicovrij businessmodel uitgelegd met een prominente propositie-blok (garantiestatement, drie kernpunten, primaire CTA) en een interactieve FAQ-accordion met zes veelgestelde bezwaren. Donkere achtergrond (slate-900) voor visueel ritme na de lichte Resultaten-sectie. Tweetalig NL/EN.

### 6. Over AIntern & Contact (main — implemented 2026-03-25)
Verhaal, visie en finale CTA om een vrijblijvend kennismakingsgesprek in te plannen. Twee-koloms layout: story/vision links, prominente indigo gradient CTA-kaart rechts. Lichte achtergrond (slate-50) sluit het donker/licht ritme af. Tweetalig NL/EN.

### 7. Contact Form & Calendly Booking Widget (feature/l08-contact-form-calendly — in progress 2026-03-28)
Dedicated contactsectie onderaan de pagina met `id="contact"` anchor. Twee-koloms layout: links een inline Calendly-bookingwidget voor directe afspraakinplanning, rechts een contactformulier als alternatief. Donkere achtergrond (slate-900) voor visueel contrast na de lichte Over-sectie. Vervangt de modal-gebaseerde CTA in de Over AIntern sectie door een directe inline ervaring. Tweetalig NL/EN.

### 8. Analytics Integration & Cookie Consent (feature/l07-analytics-integration — in progress 2026-03-28)
GDPR-compliant analytics via Plausible; stub/no-op modus totdat de bezoeker toestemming geeft via een cookie consent banner. Trackt page views en CTA-klikken. Consent-voorkeur persistent opgeslagen in localStorage. Tweetalig NL/EN cookie banner.

### 9. SEO & Meta Tags (feature/l06-seo-meta-tags — in progress 2026-03-28)
Dynamische page title, meta description en Open Graph tags via een `useHead` composable die per route de juiste NL/EN-teksten injecteert in de `<head>`. Canonical URL afgeleid van `window.location.origin + route.path`. Structured data (JSON-LD Organization schema) als static script-tag in `index.html`. Zorgt voor correcte previews bij delen op sociale media en verbeterde vindbaarheid in zoekmachines. Geen externe dependency — puur DOM-manipulatie via Vue watchers. Tweetalig NL/EN.
