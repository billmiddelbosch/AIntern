<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VALID_CATEGORIES, VALID_TAGS } from '@/composables/useKennisbankArticleEditor'
import type { KennisbankPostForm, ValidTag } from '@/composables/useKennisbankArticleEditor'
import apiClient from '@/lib/adminAxios'

const { t } = useI18n()

const props = defineProps<{
  form: KennisbankPostForm
  mode: 'create' | 'edit'
  slugConflict: boolean
  slugChecking: boolean
}>()

const emit = defineEmits<{
  'update:form': [form: KennisbankPostForm]
  'slug-conflict': [conflict: boolean]
}>()

function patch(updates: Partial<KennisbankPostForm>) {
  emit('update:form', { ...props.form, ...updates })
}

function toKebab(val: string): string {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

let slugCheckTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.form.title,
  (title) => {
    if (props.mode === 'create' && props.form.status !== 'published') {
      patch({ slug: toKebab(title) })
    }
  },
)

watch(
  () => props.form.slug,
  (slug) => {
    if (!slug) return
    if (slugCheckTimer) clearTimeout(slugCheckTimer)
    slugCheckTimer = setTimeout(async () => {
      try {
        await apiClient.get(`/admin/kennisbank/${slug}`)
        if (props.mode === 'create') emit('slug-conflict', true)
      } catch {
        emit('slug-conflict', false)
      }
    }, 500)
  },
)

const excerptLen = computed(() => props.form.excerpt.length)
const metaLen = computed(() => props.form.metaDescription.length)
const titleLen = computed(() => props.form.title.length)

const metaColor = computed(() => {
  if (metaLen.value >= 120 && metaLen.value <= 160) return 'text-emerald-600'
  return 'text-amber-500'
})

const titleColor = computed(() => {
  if (titleLen.value >= 50 && titleLen.value <= 60) return 'text-emerald-600'
  return 'text-amber-500'
})

const keywordInTitle = computed(() => {
  const title = props.form.title.toLowerCase()
  return props.form.tags.some((tag) => {
    const keyword = tag.replace(/-/g, ' ')
    return title.includes(keyword)
  })
})

const excerptPresent = computed(() => props.form.excerpt.trim().length > 0)

function toggleTag(tag: string) {
  const tags = props.form.tags.includes(tag)
    ? props.form.tags.filter((t) => t !== tag)
    : [...props.form.tags, tag]
  patch({ tags })
}

const slugReadOnly = computed(() => props.mode === 'edit' && props.form.status === 'published')
</script>

<template>
  <div class="space-y-5">
    <!-- Title -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.title') }}
        <span :class="titleColor" class="ml-2 font-normal text-xs">{{ titleLen }}/120</span>
      </label>
      <input
        :value="props.form.title"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        @input="patch({ title: ($event.target as HTMLInputElement).value })"
      />
      <p v-if="titleLen > 0 && !(titleLen >= 50 && titleLen <= 60)" class="mt-1 text-xs text-amber-500">
        {{ t('admin.articleForm.seo.titleLengthHint') }}
      </p>
    </div>

    <!-- Slug -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.slug') }}
      </label>
      <div class="relative">
        <input
          :value="props.form.slug"
          type="text"
          :readonly="slugReadOnly"
          class="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
          :class="[
            slugReadOnly ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'border-slate-200 focus:ring-indigo-400',
            props.slugConflict ? 'border-red-400 focus:ring-red-400' : '',
          ]"
          @input="!slugReadOnly && patch({ slug: ($event.target as HTMLInputElement).value })"
        />
        <span v-if="props.slugChecking" class="absolute right-2 top-2 text-xs text-slate-400">
          {{ t('admin.articleForm.fields.slugChecking') }}
        </span>
      </div>
      <p v-if="props.slugConflict" class="mt-1 text-xs text-red-500">
        {{ t('admin.articleForm.fields.slugConflict') }}
      </p>
      <p v-if="slugReadOnly" class="mt-1 text-xs text-slate-400">
        {{ t('admin.articleForm.fields.slugReadOnly') }}
      </p>
    </div>

    <!-- Category -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.category') }}
      </label>
      <select
        :value="props.form.category"
        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        @change="patch({ category: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="cat in VALID_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Published At -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.publishedAt') }}
      </label>
      <input
        :value="props.form.publishedAt"
        type="date"
        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        @change="patch({ publishedAt: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <!-- Excerpt -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.excerpt') }}
        <span class="ml-2 font-normal text-xs" :class="excerptLen > 300 ? 'text-red-500' : 'text-slate-400'">
          {{ excerptLen }}/300
        </span>
      </label>
      <textarea
        :value="props.form.excerpt"
        rows="3"
        maxlength="300"
        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        @input="patch({ excerpt: ($event.target as HTMLTextAreaElement).value })"
      />
    </div>

    <!-- Meta Description -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">
        {{ t('admin.articleForm.fields.metaDescription') }}
        <span class="ml-2 font-normal text-xs" :class="metaColor">{{ metaLen }}/160</span>
      </label>
      <textarea
        :value="props.form.metaDescription"
        rows="2"
        maxlength="160"
        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        @input="patch({ metaDescription: ($event.target as HTMLTextAreaElement).value })"
      />
      <p v-if="metaLen > 0 && !(metaLen >= 120 && metaLen <= 160)" class="mt-1 text-xs text-amber-500">
        {{ t('admin.articleForm.seo.metaLengthHint') }}
      </p>
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-2">
        {{ t('admin.articleForm.fields.tags') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in (VALID_TAGS as readonly ValidTag[])"
          :key="tag"
          type="button"
          class="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
          :class="props.form.tags.includes(tag)
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- SEO Panel -->
    <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
      <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {{ t('admin.articleForm.seo.heading') }}
      </p>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-xs">
          <span :class="titleLen >= 50 && titleLen <= 60 ? 'text-emerald-500' : 'text-amber-500'">●</span>
          <span class="text-slate-600">{{ t('admin.articleForm.seo.titleLength') }}: {{ titleLen }} chars</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span :class="metaLen >= 120 && metaLen <= 160 ? 'text-emerald-500' : 'text-amber-500'">●</span>
          <span class="text-slate-600">{{ t('admin.articleForm.seo.metaLength') }}: {{ metaLen }} chars</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span :class="keywordInTitle ? 'text-emerald-500' : 'text-amber-500'">●</span>
          <span class="text-slate-600">{{ t('admin.articleForm.seo.keywordInTitle') }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span :class="excerptPresent ? 'text-emerald-500' : 'text-amber-500'">●</span>
          <span class="text-slate-600">{{ t('admin.articleForm.seo.excerptPresent') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
