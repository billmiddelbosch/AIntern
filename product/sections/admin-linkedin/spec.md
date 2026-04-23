# A-19 — LinkedIn Posts Admin Pagina (/admin/linkedin)

**Backlog ID:** B-43  
**Owner:** CTO (Morgan) — implementatie; CMO (Blake) / Bill — primaire gebruikers  
**Effort:** M  
**Depends on:** A-02 (admin auth — live), A-14 (DynamoDB aintern-admin — live)  

---

## Overview

Bill schrijft LinkedIn posts voor zijn persoonlijk profiel via een AI ghostwriter. De posts worden aangeleverd als drafts en moeten door Bill worden beoordeeld, aangepast en handmatig gepubliceerd. Deze admin pagina biedt een overzicht en edit-workflow — identiek aan de Kennisbank admin, maar dan voor LinkedIn posts.

**Kernregel:** Posts worden NOOIT automatisch gepubliceerd. Bill publiceert altijd zelf.

---

## Data Model

```typescript
// src/types/linkedinPost.ts

export type LinkedInPostStatus = 'draft' | 'approved' | 'published' | 'archived'

export interface LinkedInPost {
  id: string              // UUID v4
  title: string           // Intern label (niet zichtbaar op LinkedIn) — bijv. "Episode 1 — Het Begin"
  content: string         // De post-tekst (plain text, LinkedIn-formattering via newlines)
  status: LinkedInPostStatus
  episode?: number        // Optioneel: afleveringsnummer in de serie
  serie?: string          // Optioneel: bijv. "Het AI-Duo Experiment"
  hashtags?: string       // Komma-gescheiden, bijv. "#HetAIDuoExperiment,#BouweninPublic"
  scheduledFor?: string   // ISO 8601 — niet afdwingen, alleen als reminder
  publishedAt?: string    // ISO 8601 — handmatig in te vullen door Bill na publicatie
  engagementNotes?: string // Vrije tekst: likes, comments, bereik na 48-72u
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
}
```

**Storage:** DynamoDB `aintern-admin` tabel (single-table design, zelfde als leads/KPI)

| pk | sk | Attributes |
|---|---|---|
| `LINKEDIN#<id>` | `POST` | alle LinkedInPost velden |

---

## Lambda Endpoints (`lambda/src/linkedin-posts.ts`)

Achter bestaande API Gateway, JWT-protected, corsOrigin+respond pattern.

| Method | Path | Actie |
|---|---|---|
| `GET` | `/linkedin-posts` | Lijst alle posts (gesorteerd op updatedAt desc) |
| `GET` | `/linkedin-posts/:id` | Haal één post op |
| `POST` | `/linkedin-posts` | Maak nieuwe post aan (status: draft) |
| `PUT` | `/linkedin-posts/:id` | Update velden (content, status, publishedAt, etc.) |
| `DELETE` | `/linkedin-posts/:id` | Soft-delete → status: archived |

---

## Component Architecture

### Route
```
/admin/linkedin   →   AdminLinkedInView.vue   (list + status tabs)
/admin/linkedin/new   →   AdminLinkedInPostFormView.vue
/admin/linkedin/:id/edit   →   AdminLinkedInPostFormView.vue
```

### Components

| Component | Verantwoordelijkheid |
|---|---|
| `AdminLinkedInView.vue` | Lijstpagina: tabs per status (draft/approved/published), tabel met titel/serie/episode/datum, "Nieuwe post" knop |
| `AdminLinkedInPostFormView.vue` | Formulier: title, content (textarea — geen rich text nodig), serie, episode, hashtags, scheduledFor, publishedAt, engagementNotes; knoppen: "Opslaan als draft", "Goedkeuren", "Archiveren" |
| `LinkedInPostStatusBadge.vue` | Kleurgecodeerde pill per status |

### Composable
```
src/composables/useLinkedInPosts.ts
```
Wraps CRUD calls. Exposes: `posts`, `fetchPosts()`, `createPost()`, `updatePost()`, `deletePost()`.

### Pinia store
```
src/stores/useLinkedInPostStore.ts
```

---

## Sidebar nav

Voeg toe aan admin sidebar onder "Content" (bij Kennisbank): "LinkedIn Posts" met LinkedIn-icoon (of `📝`).

---

## i18n

Namespace: `linkedinPosts.*` — status labels, veldlabels, knoppen, toast-berichten.

---

## Acceptance Criteria

- [ ] `/admin/linkedin` toont alle posts gegroepeerd per status-tab
- [ ] Klik op post opent edit-formulier met alle velden
- [ ] "Opslaan als draft" slaat op zonder status te wijzigen
- [ ] "Goedkeuren" zet status op `approved`
- [ ] "Archiveren" zet status op `archived` (soft delete)
- [ ] Nieuwe post aanmaken via "Nieuwe post" knop
- [ ] `publishedAt` veld is handmatig in te vullen (Bill vult dit in nadat hij zelf gepubliceerd heeft)
- [ ] `engagementNotes` veld beschikbaar voor engagement-tracking na publicatie
- [ ] Ghostwriter drafts uit `.claude/cmo/ghostwriter_drafts/` kunnen handmatig worden ingevoerd via het formulier
- [ ] `npm run type-check` pass

## Out of Scope

- Automatisch publiceren naar LinkedIn (nooit — Bill doet dit zelf)
- LinkedIn API integratie
- Scheduling automatisering
- Engagement data automatisch ophalen
