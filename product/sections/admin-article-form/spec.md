# A-05 — Kennisbank Article Create/Edit Form

**Backlog ID:** A-05
**Owner:** CTO (Morgan) — implementation; CMO (Blake) — primary user
**Effort:** L
**Depends on:** A-04 (Kennisbank list view — already live), A-02 (admin auth — already live)
**Agent:** `vuejs-feature-builder` (frontend form + composable) → `lambda-feature-builder` (new Lambda endpoints)

---

## Overview

The CMO (Blake) must be able to write, save as draft, and publish Kennisbank articles directly from the `/admin/kennisbank` dashboard — without touching the AWS CLI, S3 console, or running any terminal commands. Currently the only way to publish is via `npm run sitemap:generate` + manual S3 upload; that gate must be removed for the CMO role.

The feature adds:
1. A create/edit form view at `/admin/kennisbank/new` and `/admin/kennisbank/:slug/edit`
2. A TipTap rich-text editor for the article body
3. Two new Lambda endpoints: save draft and publish
4. Sitemap regeneration triggered server-side on publish

---

## User Stories

1. **Als CMO wil ik een nieuw artikel aanmaken** vanuit `/admin/kennisbank` met een "Nieuw artikel" knop, zodat ik geen CLI-toegang nodig heb.
2. **Als CMO wil ik een concept opslaan** zonder het te publiceren, zodat ik een artikel over meerdere sessies heen kan schrijven en bewerken.
3. **Als CMO wil ik een gepubliceerd of concept-artikel bewerken** door op de rij in de lijst te klikken, zodat ik fouten kan corrigeren zonder opnieuw te publiceren via S3.
4. **Als CMO wil ik een artikel publiceren** met één klik vanuit het formulier, waarbij de sitemap automatisch wordt bijgewerkt, zodat het artikel direct vindbaar is voor bezoekers en Google.

---

## Article Data Model

### S3 post file (`posts/<slug>.json`) — unchanged from L-11 schema

```typescript
interface KennisbankPost {
  slug: string           // URL-safe kebab-case, unique, immutable after publish
  title: string          // Plain text, max 120 chars
  category: string       // Must be one of the valid categories below
  publishedAt: string    // ISO 8601 date string (YYYY-MM-DD)
  excerpt: string        // Plain text, max 300 chars — shown in cards and OG description
  metaDescription: string // Plain text, max 160 chars — SEO meta tag
  content: string        // HTML string from TipTap serialization
  tags?: string[]        // Optional free-form tags for future filtering
  status: 'draft' | 'published' // Not stored in final S3 post; used only in admin layer
}
```

### S3 index (`index.json`) — entry shape per post

```typescript
interface IndexEntry {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
}
```

### Draft storage

Drafts are stored as S3 objects under the same `posts/<slug>.json` key but are **not** added to `index.json`. The existing `kennisbank-admin` Lambda already infers draft status from this distinction (files in `posts/` that are absent from `index.json` are drafts). The new endpoints follow the same convention. **Decision (2026-04-17): S3-only — no DynamoDB for drafts.**

---

## Valid Categories

Derived from the L-11 Kennisbank spec. These are the four initial categories; new ones require a board decision.

| Value (stored) | Display label |
|---|---|
| `AI Automatisering` | AI Automatisering |
| `MKB Praktijkcases` | MKB Praktijkcases |
| `Implementatietips` | Implementatietips |
| `AI Tools & Technologie` | AI Tools & Technologie |

## Tag Taxonomy (controlled — CEO approved 2026-04-17)

Tags are based on `product/seo/keyword-strategy.md`. The CMO selects from this fixed list; no free-form input. New tags require a board decision.

| Tag (stored) | Maps to keyword theme |
|---|---|
| `ai-automatisering` | AI automatisering MKB, herhaalprocessen automatiseren |
| `lightspeed-webshop` | Lightspeed webshop AI automatisering, productcatalogus |
| `mkb` | AI voor kleine bedrijven, MKB-segment algemeen |
| `no-cure-no-pay` | No-cure-no-pay AI implementatie |
| `roi-kostenbesparing` | ROI AI automatisering, AI stagiaire kosten MKB |
| `implementatietips` | AI implementatie stappenplan, praktische gids |
| `ai-tools` | No-code AI tools, AI Tools & Technologie |
| `klantenservice` | AI chatbot klantenservice MKB |
| `productbeschrijvingen` | Productbeschrijvingen automatisch schrijven Lightspeed |

---

## Routes

| Path | Name | Purpose |
|---|---|---|
| `/admin/kennisbank` | `admin-kennisbank` | Article list (A-04, existing) |
| `/admin/kennisbank/new` | `admin-kennisbank-new` | Create new article |
| `/admin/kennisbank/:slug/edit` | `admin-kennisbank-edit` | Edit existing article |

Both new routes use `meta: { layout: 'admin', requiresAuth: true }`.

---

## Component Architecture

```
KennisbankListView.vue (existing)
└── "Nieuw artikel" button → navigates to /admin/kennisbank/new

KennisbankArticleFormView.vue          [NEW — src/views/admin/]
├── ArticleFormHeader.vue              [NEW — src/components/admin/]
│   └── Save Draft + Publish buttons, status badge, back link
├── ArticleMetaPanel.vue               [NEW — src/components/admin/]
│   └── title, slug, category (select), publishedAt, excerpt, metaDescription, tags
└── ArticleRichTextEditor.vue          [NEW — src/components/admin/]
    └── TipTap editor instance (StarterKit + custom toolbar)
```

### Component responsibilities

**`KennisbankArticleFormView.vue`**
- Route params: `:slug` (edit mode) or absent (create mode)
- On mount in edit mode: calls `GET /admin/kennisbank/:slug` to load the post
- Owns form state as a `reactive` object typed to `KennisbankPostForm`
- Delegates save/publish actions to `useKennisbankArticleEditor` composable

**`ArticleFormHeader.vue`**
- Props: `mode: 'create' | 'edit'`, `status: 'draft' | 'published'`, `saving: boolean`, `publishing: boolean`
- Emits: `save-draft`, `publish`, `back`
- Displays a status badge (amber = draft, emerald = published) consistent with `KennisbankListView`

**`ArticleMetaPanel.vue`**
- Props + v-model for each meta field
- Auto-generates slug from title (kebab-case) in create mode; slug becomes read-only after first publish
- Category rendered as a `<select>` with the four valid values
- Character counters for excerpt (max 300) and metaDescription (max 160)

**`ArticleRichTextEditor.vue`**
- Wraps TipTap `useEditor` (Composition API)
- Toolbar: Bold, Italic, H2, H3, ordered/unordered list, blockquote, link, horizontal rule
- Emits HTML string on `update:modelValue` (v-model compatible)
- Min height 400px; scrollable

---

## Composable

**`src/composables/useKennisbankArticleEditor.ts`**

```typescript
interface KennisbankPostForm {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
  content: string        // HTML
  tags: string[]
}

interface UseKennisbankArticleEditor {
  form: KennisbankPostForm
  loading: Ref<boolean>
  saving: Ref<boolean>
  publishing: Ref<boolean>
  error: Ref<string | null>
  loadArticle(slug: string): Promise<void>
  saveDraft(): Promise<void>
  publish(): Promise<void>
}
```

- `loadArticle` calls `GET /admin/kennisbank/:slug` (new endpoint — see Lambda section)
- `saveDraft` calls `PUT /admin/kennisbank/:slug` with `{ ...form, status: 'draft' }`
- `publish` calls `POST /admin/kennisbank/:slug/publish` — Lambda writes to S3 + updates `index.json` + triggers sitemap

---

## API / Lambda Requirements

### Extend existing `kennisbank-admin` Lambda (`lambda/src/kennisbank-admin.ts`)

The existing handler only handles `GET` (list). Add three new routes:

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/admin/kennisbank/:slug` | Fetch full post JSON from S3 `posts/<slug>.json` | JWT required |
| `PUT` | `/admin/kennisbank/:slug` | Create or update post in S3 (draft — not in index) | JWT required |
| `POST` | `/admin/kennisbank/:slug/publish` | Write to S3 + update `index.json` + trigger sitemap | JWT required |
| `DELETE` | `/admin/kennisbank/:slug` | Remove `posts/<slug>.json` from S3; remove entry from `index.json` if present | JWT required |

#### `PUT /admin/kennisbank/:slug` — Save draft

Request body:
```json
{
  "slug": "ai-voor-mkb-stap-voor-stap",
  "title": "AI voor het MKB: stap voor stap",
  "category": "AI Automatisering",
  "publishedAt": "2026-04-17",
  "excerpt": "...",
  "metaDescription": "...",
  "content": "<p>...</p>",
  "tags": []
}
```

Behaviour:
- Validates slug matches path param
- Validates category is one of the four valid values
- Writes `posts/<slug>.json` to S3 (PutObjectCommand)
- Does NOT touch `index.json`
- Returns `200 { slug }` on success

#### `POST /admin/kennisbank/:slug/publish` — Publish

Behaviour:
1. Validates JWT + request body (same shape as PUT)
2. Writes `posts/<slug>.json` to S3
3. Reads current `index.json`, upserts the `IndexEntry` for this slug, writes updated `index.json` back to S3
4. Invokes sitemap regeneration (see below)
5. Returns `200 { slug, publishedAt }`

#### Sitemap regeneration on publish

**Decision (2026-04-17):** Lambda regenerates sitemap directly and writes it to S3. AWS Amplify serves the app (not CloudFront); the sitemap must be accessible at `https://aintern.nl/sitemap.xml`.

Implementation:
- The publish Lambda enumerates all slugs via `ListObjectsV2` (already in scope), builds the sitemap XML in-process using the same logic as `scripts/generate-sitemap.ts`, and writes `sitemap.xml` as a public S3 object.
- AWS Amplify must be configured to serve `sitemap.xml` from the correct S3 path. Verify existing Amplify rewrites/redirects — if Amplify already serves the `public/` build output, the Lambda-written file must land in the same serving path, or a rewrite rule must point `/sitemap.xml` to the S3 URL.
- Requires: S3 `PutObject` permission on the Lambda IAM role for the sitemap destination path.
- The `scripts/generate-sitemap.ts` local script (and `npm run sitemap:generate`) remains available for manual rebuilds during development.

---

## TipTap Integration Approach

Install packages:
```
@tiptap/vue-3
@tiptap/starter-kit
@tiptap/extension-link
```

`ArticleRichTextEditor.vue` uses the `useEditor` composable from `@tiptap/vue-3`:

```typescript
const editor = useEditor({
  extensions: [StarterKit, Link.configure({ openOnClick: false })],
  content: props.modelValue,
  onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
})
```

The editor outputs HTML which is stored verbatim in `content` — the same format already used by the AI-generated articles rendered via `v-html` in `KennisbankArtikelView.vue`. No format conversion needed.

---

## Draft vs Published Flow

```
CMO opens /admin/kennisbank/new
  └─► fills in meta + body
       ├─► "Opslaan als concept"
       │     └─► PUT /admin/kennisbank/:slug → writes posts/<slug>.json (NOT in index)
       │         → appears in list with status = draft
       └─► "Publiceren"
             └─► POST /admin/kennisbank/:slug/publish
                 → writes posts/<slug>.json
                 → upserts index.json
                 → regenerates sitemap.xml
                 → status = published
                 → article live on /kennisbank

CMO opens existing article (draft or published)
  └─► clicks row in list → navigates to /admin/kennisbank/:slug/edit
       └─► same form, pre-populated
           ├─► "Opslaan" → PUT (updates S3 object; if published, does NOT remove from index)
           └─► "Publiceren" → POST /publish (idempotent; re-publishes with latest content)
```

Editing a published article and saving (without re-publishing) updates the S3 post object but does not change `index.json` or the sitemap. The live article body updates immediately since `KennisbankArtikelView` fetches directly from S3.

---

## Acceptance Criteria

- [ ] "Nieuw artikel" button visible in `KennisbankListView` for authenticated CMO
- [ ] `/admin/kennisbank/new` renders the article form with all meta fields and TipTap editor
- [ ] Slug auto-generates from title in create mode (kebab-case, lowercase, ASCII-safe)
- [ ] Slug live-check: form calls `GET /admin/kennisbank/:slug` on slug change and shows an inline error if slug already exists; backend also returns 409 on `PUT` if slug exists and is published (double guard)
- [ ] Slug field is read-only after the article has been published (to preserve existing URLs)
- [ ] Category field is a dropdown restricted to the four valid categories
- [ ] Tag field is a multi-select restricted to the controlled taxonomy (9 tags from keyword-strategy.md); no free-form input
- [ ] Excerpt character counter enforces max 300 chars; metaDescription max 160 chars
- [ ] **SEO panel (in-form indicators):** displays live feedback while CMO types — (1) meta description length with green/amber/red indicator (target: 120–160 chars); (2) title length indicator (target: 50–60 chars); (3) check whether the primary keyword from at least one selected tag appears in the title; (4) excerpt present check
- [ ] "Opslaan als concept" calls `PUT /admin/kennisbank/:slug` and shows a success toast; does not publish
- [ ] "Publiceren" calls `POST /admin/kennisbank/:slug/publish`; article appears in `/kennisbank` immediately after
- [ ] After publish, `index.json` in S3 contains the new/updated `IndexEntry`
- [ ] After publish, Lambda regenerates `sitemap.xml` and writes it to S3; `sitemap.xml` includes `/kennisbank/:slug`
- [ ] Clicking a row in `KennisbankListView` navigates to `/admin/kennisbank/:slug/edit` and pre-populates the form
- [ ] Edit mode for a published article shows an amber warning if the user edits meta without re-publishing
- [ ] "Verwijderen" button visible in edit mode (all articles); shows a confirmation modal before calling `DELETE /admin/kennisbank/:slug`; on success, article removed from S3 + `index.json` + sitemap regenerated; navigates back to list
- [ ] All API calls include the JWT `Authorization: Bearer` header via the existing `adminAxios` interceptor
- [ ] Lambda returns correct CORS headers following the `corsOrigin` + `respond` pattern from `CLAUDE.md`
- [ ] `npm run type-check` passes with no errors after implementation
- [ ] No `any` types in new files

---

## Decisions Log (CEO — 2026-04-17)

1. **Sitemap storage** → Lambda writes `sitemap.xml` to `s3://aintern-kennisbank/sitemap.xml`. Amplify custom rule redirects `/sitemap.xml` → `https://aintern-kennisbank.s3.eu-west-2.amazonaws.com/sitemap.xml` (301). This is the same pattern as the CityCast Amplify app (appId: `d24lauvefdy1yg`). **Amplify app for AIntern: `d3jac06fdga6zb` (eu-west-1).**
2. **Draft persistence** → S3-only (no DynamoDB). Draft = file in `posts/` absent from `index.json`.
3. **Slug collision** → Frontend live-check (UX) + backend 409 on `PUT` (safety net).
4. **Tag taxonomy** → Controlled vocabulary based on `product/seo/keyword-strategy.md` (9 tags defined above). No free-form input.
5. **Article deletion** → In scope. `DELETE /admin/kennisbank/:slug` endpoint required; confirmation modal in edit form; sitemap regenerated after delete.
6. **SEO in-form indicators** → In scope (meta description length, title length, keyword presence check, excerpt present). Traffic/Search Console data → separate item S-09.

## Infrastructure Checklist (implementation team)

- [ ] Add Amplify custom rule to app `d3jac06fdga6zb`:
  ```json
  { "source": "/sitemap.xml", "target": "https://aintern-kennisbank.s3.eu-west-2.amazonaws.com/sitemap.xml", "status": "301" }
  ```
  Insert **before** the SPA fallback rule. Use AWS CLI: `aws amplify update-app --app-id d3jac06fdga6zb --region eu-west-1 --custom-rules [...]`
- [ ] Ensure `s3://aintern-kennisbank/sitemap.xml` is public-read (same ACL as `posts/*.json`)
- [ ] Confirm Lambda IAM role (`AInternAdminStack`) has `s3:PutObject` on `aintern-kennisbank/sitemap.xml`

---

## Out of Scope (A-05)

- Multi-author support or authorship attribution
- Article preview in a separate browser tab (can be added as A-05b)
- Image upload / media management
- Scheduled publish (publishedAt in the future)
- Version history / revision compare
