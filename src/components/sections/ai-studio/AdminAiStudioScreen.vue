<!--
  AdminAiStudioScreen.vue [PAGE — design prototype]

  This is the design-stage prototype of AdminAiStudioView.vue.
  It renders inside the admin layout (sidebar + header already provided by the
  admin shell) and composes AiStudioHeader + two ComponentBuilder instances
  (one per tab) inside a single max-w-5xl container.

  In the IMPLEMENT stage this becomes src/views/admin/AdminAiStudioView.vue.
  The ComponentBuilder organism will be wired to the useAiStudio composable.
  Sample data imported here will be replaced by real API calls.

  ─── FULL PAGE WIREFRAME (ASCII, admin context) ──────────────────────────────

  ┌──────────┬──────────────────────────────────────────────────────────────┐
  │ SIDEBAR  │ HEADER: "AI Studio"                          [user] [logout] │
  │  64px    ├──────────────────────────────────────────────────────────────┤
  │ Dashboard│                                                               │
  │ KPI      │  ┌─ max-w-5xl mx-auto space-y-6 ────────────────────────┐   │
  │ Kennisbnk│  │                                                        │   │
  │ LinkedIn │  │  AI Studio                                             │   │
  │ Leads    │  │  Genereer Vue 3 components en templates met Claude AI  │   │
  │ Onboardng│  │                                                        │   │
  │ Groei    │  │  [Component Builder]  [Template Builder]               │   │ ← AiStudioHeader
  │ Org      │  │  ─────────────────────────────────────────────────    │   │   tab bar
  │ AI Studio│  │                                                        │   │
  │  ●actief │  │  ┌─ AiPromptPanel ──────────────────────────────────┐ │   │
  │          │  │  │ Beschrijf wat je wilt bouwen                      │ │   │
  │          │  │  │ ┌──────────────────────────────────────────────┐  │ │   │
  │          │  │  │ │ textarea (4 rows, resize-y)                   │  │ │   │
  │          │  │  │ └──────────────────────────────────────────────┘  │ │   │
  │          │  │  │                                      128 / 500 ▸  │ │   │
  │          │  │  │ [⚡ Genereren]  ● Generated                       │ │   │
  │          │  │  └──────────────────────────────────────────────────┘ │   │
  │          │  │                                                        │   │
  │          │  │  ┌─ AiCodeEditor (dark) ──┐ ┌─ AiPreviewPane ───────┐ │   │
  │          │  │  │ Code  .vue  [Kopieer]  │ │ Preview  [Vernieuwen] │ │   │
  │          │  │  │ ───────────────────── │ │ ─────────────────────  │ │   │
  │          │  │  │  <script setup>       │ │   ┌───────────────┐    │ │   │
  │          │  │  │  const props = …      │ │   │  rendered     │    │ │   │
  │          │  │  │  </script>            │ │   │  component    │    │ │   │
  │          │  │  │  <template>…          │ │   └───────────────┘    │ │   │
  │          │  │  │ ── 24 regels ──────── │ │                         │ │   │
  │          │  │  └───────────────────────┘ └─────────────────────────┘ │   │
  │          │  │                                                        │   │
  │          │  │  ┌─ AiSavePanel ────────────────────────────────────┐ │   │
  │          │  │  │ Componentnaam (PascalCase)                        │ │   │
  │          │  │  │ ┌─────────────────────────┐ ┌────────────────┐   │ │   │
  │          │  │  │ │ PricingCard             │ │ Opslaan in repo│   │ │   │
  │          │  │  │ └─────────────────────────┘ └────────────────┘   │ │   │
  │          │  │  │ [template only] ○ ─ Instellen als actief template │ │   │
  │          │  │  │ ✓ Opgeslagen als PricingCard.vue                  │ │   │
  │          │  │  └──────────────────────────────────────────────────┘ │   │
  │          │  │                                                        │   │
  │          │  │  ┌─ AiGalleryPanel (collapsible) ─────────────────┐   │   │
  │          │  │  │ Eerder gegenereerd (3)              ▼ Inklappen │   │   │
  │          │  │  │ ─────────────────────────────────────────────── │   │   │
  │          │  │  │ ┌─ AiGalleryCard ──────────────────────────────┐│   │   │
  │          │  │  │ │PricingCard  src/components/…/PricingCard.vue ││   │   │
  │          │  │  │ │Create a pricing card…              6 mei 2026 ││   │   │
  │          │  │  │ │                        [Laden] [Verwijderen]  ││   │   │
  │          │  │  │ └──────────────────────────────────────────────┘│   │   │
  │          │  │  └────────────────────────────────────────────────┘    │   │
  │          │  └────────────────────────────────────────────────────────┘   │
  └──────────┴──────────────────────────────────────────────────────────────┘

  ─── TEMPLATE BUILDER DIFF ────────────────────────────────────────────────────
  Identical layout. Differences:
  - AiPreviewPane receives mockData prop → shows "Mock data" amber badge in toolbar
  - AiSavePanel shows "Set as active template" toggle after first successful save
  - Gallery shows KennisbankArtikelView* entries instead of component entries
  ─────────────────────────────────────────────────────────────────────────────
-->
<script setup lang="ts">
import { ref } from 'vue'
import AiStudioHeader from './AiStudioHeader.vue'
import ComponentBuilder from './ComponentBuilder.vue'
import type { AiStudioItemType } from '@/../product/sections/ai-studio/types'
import data from '@/../product/sections/ai-studio/data.json'

const activeTab = ref<AiStudioItemType>('component')
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header + tab switcher -->
    <AiStudioHeader
      v-model:active-tab="activeTab"
    />

    <!-- Component Builder tab -->
    <ComponentBuilder
      v-if="activeTab === 'component'"
      type="component"
      :initial-gallery="(data.componentItems as any)"
    />

    <!-- Template Builder tab -->
    <ComponentBuilder
      v-else
      type="template"
      :initial-gallery="(data.templateItems as any)"
      :initial-mock-article="(data.mockArticle as any)"
      :initial-active-template="data.templateConfig.activeTemplateName"
    />
  </div>
</template>
