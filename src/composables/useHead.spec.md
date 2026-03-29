---
feature: L-06 SEO & Meta Tags
atomic-level: N/A (composable — no visual component)
last-updated: 2026-03-28
---

# useHead Composable Spec

## Atomic Level
N/A — This is a composable, not a visual component. It has no Atomic Design classification.

## Atomic Rationale
N/A — Infrastructure composable. Manages DOM `<head>` tags reactively.

## Purpose
Injects and keeps in sync all SEO-related `<head>` elements:
- `<title>`
- `<meta name="description">`
- `<meta name="robots">`
- Open Graph properties (`og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:locale`, etc.)
- Twitter Card meta tags
- `<link rel="canonical">`
- `<html lang="…">` attribute

Called once at the app root (`App.vue`). Reacts automatically to locale changes (vue-i18n) and route changes (vue-router).

## Signature

```ts
function useHead(): void
```

No parameters — sources data from:
- `useI18n()` — reads `seo.home.title`, `seo.home.description`, `seo.home.ogImageAlt`
- `useRoute()` — derives canonical URL from `route.path`
- `window.location.origin` — forms absolute URLs

## Internal Behaviour

1. `watchEffect` runs on mount and whenever `locale` or `route.path` changes
2. Calls `getOrCreate(selector, tag, attrs)` — finds existing element or creates and appends to `<head>`
3. Sets `document.title`, `document.documentElement.lang`, and all meta/link attributes
4. `onUnmounted` stops the watcher (cleans up when `App.vue` unmounts, i.e., never in SPA operation — but correct for testing)

## Composables Used
- `useI18n` from `vue-i18n`
- `useRoute` from `vue-router`

## State
- No Pinia store interaction
- Reads reactive `locale` from vue-i18n
- Reads reactive `route` from vue-router

## i18n Keys Required

| Key | Description |
|---|---|
| `seo.home.title` | `<title>` and all title meta tags |
| `seo.home.description` | `<meta name="description">` and og/twitter description |
| `seo.home.ogImageAlt` | `og:image:alt` and `twitter:image:alt` |

## Acceptance Criteria

- [ ] `document.title` equals `t('seo.home.title')` after mount
- [ ] `<meta name="description">` content equals `t('seo.home.description')`
- [ ] `<meta property="og:title">` content equals `t('seo.home.title')`
- [ ] `<meta property="og:url">` content equals `window.location.origin + route.path`
- [ ] `<link rel="canonical">` href equals `window.location.origin + route.path`
- [ ] `<meta name="robots">` content is `"index, follow"`
- [ ] `<html lang>` is `"nl"` when locale is `"nl"`, `"en"` when locale is `"en"`
- [ ] When locale changes to EN, all title/description tags update within the same render cycle

## File Location
`src/composables/useHead.ts`

## Test Location
`src/composables/useHead.spec.ts`
