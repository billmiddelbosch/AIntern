import { ref, computed } from 'vue'
import apiClient from '@/lib/axios'
import type {
  AiStudioTemplate,
  AiStudioTemplateId,
  AiStudioComponent,
  AiStudioGenerateRequest,
  AiStudioGenerateResponse,
  AiStudioSaveRequest,
  AiStudioGalleryResponse,
  AiStudioTemplateConfigResponse,
} from '@/types/aiStudio'

const STATIC_TEMPLATES: AiStudioTemplate[] = [
  {
    id: 'vue-component',
    label: 'Vue Component',
    description: 'A reusable Vue 3 SFC with script setup and Tailwind styling.',
    defaultPrompt: 'A reusable card component with a title, description, and a CTA button.',
    scaffoldCode: '',
  },
  {
    id: 'pinia-store',
    label: 'Pinia Store',
    description: 'A Pinia store using defineStore with Composition API syntax.',
    defaultPrompt: 'A store for managing a list of items with CRUD operations.',
    scaffoldCode: '',
  },
  {
    id: 'composable',
    label: 'Composable',
    description: 'A Vue 3 composable (useXxx) with reactive state and typed return.',
    defaultPrompt: 'A composable for fetching and caching data from an API endpoint.',
    scaffoldCode: '',
  },
  {
    id: 'landing-section',
    label: 'Landing Section',
    description: 'A responsive landing page section with Tailwind layout.',
    defaultPrompt: 'A hero section with a headline, subtext, and two CTA buttons.',
    scaffoldCode: '',
  },
  {
    id: 'kennisbank-variant',
    label: 'KB Artikel Variant',
    description: 'Variant van de Kennisbank artikelpagina — voeg componenten toe, verwijder of herorden ze.',
    defaultPrompt: 'Verwijder KbArticleMeta en toon de datum klein onder de titel.',
    scaffoldCode: `<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'
import { AppShell } from '@/components/shell'
import { useKennisbank } from '@/composables/useKennisbank'
import type { BlogPost } from '@/types/kennisbank'
import KbArticleBackNav from '@/components/kennisbank/KbArticleBackNav.vue'
import KbArticleSkeleton from '@/components/kennisbank/KbArticleSkeleton.vue'
import KbArticleNotFound from '@/components/kennisbank/KbArticleNotFound.vue'
import KbArticleMeta from '@/components/kennisbank/KbArticleMeta.vue'
import KbArticleHeader from '@/components/kennisbank/KbArticleHeader.vue'
import KbArticleBody from '@/components/kennisbank/KbArticleBody.vue'

const { locale } = useI18n()
const route = useRoute()
const { loading, error, fetchPost } = useKennisbank()

const post = ref<BlogPost | null>(null)
const notFound = ref(false)

async function load(slug: string) {
  notFound.value = false
  post.value = null
  const result = await fetchPost(slug)
  if (!result) { notFound.value = true } else { post.value = result }
}

onMounted(() => load(route.params.slug as string))
watch(() => route.params.slug, (slug) => { if (typeof slug === 'string') load(slug) })

const formattedDate = computed(() => {
  if (!post.value) return ''
  return new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(post.value.publishedAt))
})

const sanitizedContent = computed(() =>
  post.value ? DOMPurify.sanitize(post.value.content) : ''
)
</script>

<template>
  <AppShell>
    <div class="kb-artikel">
      <div class="kb-artikel__container">
        <KbArticleBackNav />
        <KbArticleSkeleton v-if="loading" />
        <KbArticleNotFound v-else-if="notFound || error" />
        <article v-else-if="post" class="kb-artikel__article">
          <KbArticleMeta :category="post.category" :published-at="post.publishedAt" :formatted-date="formattedDate" />
          <KbArticleHeader :title="post.title" :excerpt="post.excerpt" />
          <KbArticleBody :sanitized-content="sanitizedContent" />
        </article>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.kb-artikel {
  padding: 4rem 1rem 6rem;
  background: #f8fafc;
  min-height: calc(100vh - 4rem);
}
.kb-artikel__container { max-width: 48rem; margin: 0 auto; }
.kb-artikel__article {
  background: white;
  border-radius: 1.25rem;
  padding: 3rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
}
@media (max-width: 639px) {
  .kb-artikel { padding: 2.5rem 1rem 4rem; }
  .kb-artikel__article { padding: 2rem 1.5rem; }
}
</style>`,
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Start from scratch — describe anything.',
    defaultPrompt: '',
    scaffoldCode: '',
  },
]

export function useAiStudio() {
  // Template config
  const templates = ref<AiStudioTemplate[]>([])
  const templatesLoading = ref(false)
  const templatesError = ref<string | null>(null)

  // Selected template & prompt
  const selectedTemplateId = ref<AiStudioTemplateId>('vue-component')
  const prompt = ref('')
  const selectedTemplate = computed<AiStudioTemplate | undefined>(
    () => templates.value.find((t) => t.id === selectedTemplateId.value),
  )

  // Editor state
  const code = ref('')

  // Generate state
  const generating = ref(false)
  const generateError = ref<string | null>(null)

  // Save state
  const saveName = ref('')
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  const saveConflict = ref(false)
  const savedId = ref<string | null>(null)

  // Gallery state
  const galleryItems = ref<AiStudioComponent[]>([])
  const galleryLoading = ref(false)
  const galleryError = ref<string | null>(null)

  // Load templates from lambda, fall back to static list if unreachable
  async function fetchTemplates(): Promise<void> {
    templatesLoading.value = true
    templatesError.value = null
    try {
      const res = await apiClient.get<AiStudioTemplateConfigResponse>(
        '/admin/ai-studio/template-config',
      )
      const lambdaTemplates = res.data.templates
      const lambdaIds = new Set(lambdaTemplates.map((t) => t.id))
      templates.value = [
        ...lambdaTemplates,
        ...STATIC_TEMPLATES.filter((t) => !lambdaIds.has(t.id)),
      ]
    } catch {
      templates.value = STATIC_TEMPLATES
    } finally {
      if (templates.value.length > 0 && !selectedTemplateId.value) {
        selectedTemplateId.value = templates.value[0].id
      }
      templatesLoading.value = false
    }
  }

  // Select template and pre-fill prompt/code scaffold
  function selectTemplate(id: AiStudioTemplateId): void {
    selectedTemplateId.value = id
    const tpl = templates.value.find((t) => t.id === id)
    if (tpl) {
      prompt.value = tpl.defaultPrompt
      code.value = tpl.scaffoldCode
    }
    saveError.value = null
    saveConflict.value = false
    savedId.value = null
  }

  // Generate code via AI
  async function generate(): Promise<void> {
    if (!prompt.value.trim()) return
    generating.value = true
    generateError.value = null
    try {
      const payload: AiStudioGenerateRequest = {
        templateId: selectedTemplateId.value,
        prompt: prompt.value,
        existingCode: code.value || undefined,
      }
      const res = await apiClient.post<AiStudioGenerateResponse>(
        '/admin/ai-studio/generate',
        payload,
        { timeout: 60_000 },
      )
      code.value = res.data.code
    } catch (err) {
      generateError.value = err instanceof Error ? err.message : 'Generation failed'
    } finally {
      generating.value = false
    }
  }

  // Save component to gallery
  async function saveComponent(): Promise<boolean> {
    if (!saveName.value.trim() || !code.value.trim()) return false
    saving.value = true
    saveError.value = null
    saveConflict.value = false
    savedId.value = null
    try {
      const payload: AiStudioSaveRequest = {
        name: saveName.value,
        templateId: selectedTemplateId.value,
        prompt: prompt.value,
        code: code.value,
      }
      const res = await apiClient.post<AiStudioComponent>(
        '/admin/ai-studio/save',
        payload,
      )
      savedId.value = res.data.id
      return true
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err as { status?: number }).status === 409
      ) {
        saveConflict.value = true
        saveError.value = 'A component with this name already exists.'
      } else if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 409
      ) {
        saveConflict.value = true
        saveError.value = 'A component with this name already exists.'
      } else {
        saveError.value = err instanceof Error ? err.message : 'Failed to save'
      }
      return false
    } finally {
      saving.value = false
    }
  }

  // Fetch gallery
  async function fetchGallery(): Promise<void> {
    galleryLoading.value = true
    galleryError.value = null
    try {
      const res = await apiClient.get<AiStudioGalleryResponse>('/admin/ai-studio/gallery')
      galleryItems.value = res.data.items
    } catch (err) {
      galleryError.value = err instanceof Error ? err.message : 'Failed to load gallery'
    } finally {
      galleryLoading.value = false
    }
  }

  // Load a gallery item into the editor
  function loadFromGallery(item: AiStudioComponent): void {
    selectedTemplateId.value = item.templateId
    prompt.value = item.prompt
    code.value = item.code
    saveName.value = item.name
    saveError.value = null
    saveConflict.value = false
    savedId.value = null
  }

  return {
    // Template
    templates,
    templatesLoading,
    templatesError,
    selectedTemplateId,
    selectedTemplate,
    fetchTemplates,
    selectTemplate,
    // Prompt & code
    prompt,
    code,
    // Generate
    generating,
    generateError,
    generate,
    // Save
    saveName,
    saving,
    saveError,
    saveConflict,
    savedId,
    saveComponent,
    // Gallery
    galleryItems,
    galleryLoading,
    galleryError,
    fetchGallery,
    loadFromGallery,
  }
}
