import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import jwt from 'jsonwebtoken'
import { corsOrigin, respond } from './utils/cors'

const ssm = new SSMClient({ region: 'eu-west-2' })

let cachedJwtSecret: string | null = null

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[ai-studio-template-config] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const value = result.Parameter?.Value
  if (!value) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = value
  return cachedJwtSecret
}

async function requireAuth(event: APIGatewayProxyEvent, alias: string): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] })
  } catch (err: unknown) {
    console.warn('[ai-studio-template-config] requireAuth | JWT failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

const TEMPLATES = [
  {
    id: 'vue-component',
    label: 'Vue Component',
    description: 'A reusable Vue 3 SFC with script setup and Tailwind styling.',
    defaultPrompt: 'A reusable card component with a title, description, and a CTA button.',
    scaffoldCode: `<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-6">
    <h2 class="text-lg font-semibold text-slate-800">{{ props.title }}</h2>
    <p v-if="props.description" class="mt-2 text-sm text-slate-500">{{ props.description }}</p>
  </div>
</template>`,
  },
  {
    id: 'pinia-store',
    label: 'Pinia Store',
    description: 'A Pinia store using defineStore with Composition API syntax.',
    defaultPrompt: 'A store for managing a list of items with CRUD operations.',
    scaffoldCode: `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useItemStore = defineStore('items', () => {
  const items = ref<string[]>([])

  function addItem(item: string): void {
    items.value.push(item)
  }

  function removeItem(index: number): void {
    items.value.splice(index, 1)
  }

  return { items, addItem, removeItem }
})`,
  },
  {
    id: 'composable',
    label: 'Composable',
    description: 'A Vue 3 composable (useXxx) with reactive state and typed return.',
    defaultPrompt: 'A composable for fetching and caching data from an API endpoint.',
    scaffoldCode: `import { ref } from 'vue'

export function useExample() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<unknown>(null)

  async function fetch(url: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await window.fetch(url)
      data.value = await res.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, data, fetch }
}`,
  },
  {
    id: 'landing-section',
    label: 'Landing Section',
    description: 'A responsive landing page section with Tailwind layout.',
    defaultPrompt: 'A hero section with a headline, subtext, and two CTA buttons.',
    scaffoldCode: `<script setup lang="ts">
const props = defineProps<{
  headline: string
  subtext?: string
}>()
</script>

<template>
  <section class="py-20 px-6 text-center">
    <h1 class="text-4xl font-bold text-slate-900 tracking-tight">{{ props.headline }}</h1>
    <p v-if="props.subtext" class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{{ props.subtext }}</p>
    <div class="mt-8 flex flex-wrap gap-4 justify-center">
      <button class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
        Get started
      </button>
      <button class="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-colors">
        Learn more
      </button>
    </div>
  </section>
</template>`,
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

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', alias, requestOrigin)
  }

  try {
    await requireAuth(event, alias)
  } catch {
    return respond(401, { message: 'Unauthorized' }, alias, requestOrigin)
  }

  if (event.httpMethod !== 'GET') {
    return respond(405, { message: 'Method not allowed' }, alias, requestOrigin)
  }

  return respond(200, { templates: TEMPLATES }, alias, requestOrigin)
}
