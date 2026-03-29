---
feature: L-06 SEO & Meta Tags
status: in-progress
branch: feature/l06-seo-meta-tags
last-updated: 2026-03-28
---

# L-06 SEO & Meta Tags — Feature Spec

## Problem Being Solved

The AIntern landing page currently has a static `<title>AIntern</title>` and no `<meta>` tags beyond viewport. This means:
- Google indexes "AIntern" as the page title with no description snippet
- Sharing the URL on LinkedIn, WhatsApp, or Twitter shows no preview card
- There is no canonical URL preventing duplicate-content penalties
- There is no structured data for rich search results

## User Stories

1. As a visitor who receives a link to AIntern on WhatsApp/LinkedIn, I want to see a meaningful preview card with title, description, and image so I understand what the site is before clicking.
2. As a search engine crawler, I want a descriptive `<title>`, `<meta name="description">`, canonical URL, and JSON-LD structured data so I can rank and display the page accurately.
3. As a developer, I want a single composable to manage all head tags so adding SEO to future routes is a one-liner.

## Acceptance Criteria

- [ ] `<title>` changes to the locale-appropriate page title for the home route
- [ ] `<meta name="description">` is present and non-empty on all routes
- [ ] `<meta property="og:title">`, `og:description`, `og:url`, `og:type`, `og:image` are present
- [ ] `<meta name="twitter:card">`, `twitter:title`, `twitter:description` are present
- [ ] `<link rel="canonical">` points to the correct absolute URL for the current route
- [ ] `<meta name="robots" content="index, follow">` is present
- [ ] JSON-LD `Organization` schema is present in `<head>` as a `<script type="application/ld+json">`
- [ ] When the locale switches (NL ↔ EN), all meta tags update reactively
- [ ] `<html lang="">` attribute updates to match the active locale
- [ ] All head manipulation is cleaned up when the component using the composable unmounts

## Deliverables

| Artefact | Path | Notes |
|---|---|---|
| `useHead` composable | `src/composables/useHead.ts` | Core composable for DOM head management |
| SEO meta locale keys (EN) | `src/locales/en.json` — `seo` key | title, description, og:image alt |
| SEO meta locale keys (NL) | `src/locales/nl.json` — `seo` key | title, description, og:image alt |
| JSON-LD in index.html | `index.html` | Static Organization schema |
| App.vue integration | `src/App.vue` | Call `useHead()` at app root |
| E2E test | `e2e/seo-meta-tags.spec.ts` | Verify all meta tags in browser |
| Unit test | `src/composables/useHead.spec.ts` | Verify composable behaviour |

## Composable Interface — `useHead`

```ts
interface HeadMeta {
  title: string           // <title> and og:title / twitter:title
  description: string     // <meta name="description"> / og:description / twitter:description
  canonicalUrl: string    // <link rel="canonical"> href and og:url
  ogImage?: string        // og:image URL (defaults to /og-image.png)
  ogImageAlt?: string     // og:image:alt
}

function useHead(meta?: Ref<HeadMeta> | HeadMeta): void
```

- When called with no arguments, reads from the `seo` i18n keys for the current locale + current route
- Watches locale changes reactively and updates all DOM nodes
- Uses `watchEffect` to keep tags in sync
- On `onUnmounted`, removes managed tags and restores originals

## i18n Schema Extension

### `seo` key (both locales)

```json
{
  "seo": {
    "home": {
      "title": "...",
      "description": "...",
      "ogImageAlt": "..."
    }
  }
}
```

## JSON-LD Organization Schema (static, in index.html)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AIntern",
  "url": "https://aintern.nl",
  "description": "AIntern helpt MKB-bedrijven hun interne processen slimmer te maken met gerichte AI-oplossingen — no-cure-no-pay.",
  "logo": "https://aintern.nl/favicon.ico",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "info@aintern.nl",
    "availableLanguage": ["Dutch", "English"]
  }
}
```

## Dependencies & Risks

- No external library needed — pure DOM manipulation via Vue watchers
- OG image (`/og-image.png`) must exist in `public/` — will create a placeholder
- `window.location.origin` used for canonical; works in SSG/static hosting

## Atomic Level

N/A — this feature produces a composable and meta-level infrastructure, not a visual component.
