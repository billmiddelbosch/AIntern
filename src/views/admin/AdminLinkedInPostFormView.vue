<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLinkedInPostStore } from '@/stores/useLinkedInPostStore'
import { useLinkedInPosts } from '@/composables/useLinkedInPosts'
import LinkedInPostStatusBadge from '@/components/linkedin/LinkedInPostStatusBadge.vue'
import ArticleRichTextEditor from '@/components/admin/ArticleRichTextEditor.vue'
import type { LinkedInPost } from '@/types/linkedinPost'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useLinkedInPostStore()
const { updatePost, deletePost } = useLinkedInPosts()

const mode = computed<'create' | 'edit'>(() =>
  route.name === 'admin-linkedin-new' ? 'create' : 'edit',
)

const saving = ref(false)
const archiving = ref(false)
const copied = ref(false)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
const showArchiveConfirm = ref(false)
const existingPost = ref<LinkedInPost | null>(null)

const form = ref({
  title: '',
  content: '',
  serie: '',
  episode: '' as string | number,
  hashtags: '',
  scheduledFor: '',
  publishedAt: '',
  engagementNotes: '',
})

onMounted(async () => {
  if (mode.value === 'edit') {
    const id = route.params.id as string
    if (store.posts.length === 0) await store.loadPosts()
    const found = store.posts.find((p) => p.id === id)
    if (found) {
      existingPost.value = found
      form.value = {
        title: found.title,
        content: found.content,
        serie: found.serie ?? '',
        episode: found.episode !== undefined ? found.episode : '',
        hashtags: found.hashtags ?? '',
        scheduledFor: found.scheduledFor ?? '',
        publishedAt: found.publishedAt ?? '',
        engagementNotes: found.engagementNotes ?? '',
      }
    }
  }
})

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  setTimeout(() => (toast.value = null), 3500)
}

function buildPayload(statusOverride?: 'draft' | 'approved') {
  return {
    title: form.value.title,
    content: form.value.content,
    serie: form.value.serie || undefined,
    episode: form.value.episode !== '' ? Number(form.value.episode) : undefined,
    hashtags: form.value.hashtags || undefined,
    scheduledFor: form.value.scheduledFor || undefined,
    publishedAt: form.value.publishedAt || undefined,
    engagementNotes: form.value.engagementNotes || undefined,
    ...(statusOverride ? { status: statusOverride } : {}),
  }
}

async function handleSaveDraft() {
  saving.value = true
  try {
    if (mode.value === 'create') {
      const created = await store.create(buildPayload())
      showToast(t('linkedinPosts.toasts.draftSaved'))
      setTimeout(() => router.replace({ name: 'admin-linkedin-edit', params: { id: created.id } }), 600)
    } else {
      const id = route.params.id as string
      await updatePost(id, buildPayload())
      showToast(t('linkedinPosts.toasts.draftSaved'))
    }
  } catch {
    showToast(t('linkedinPosts.toasts.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}

async function handleApprove() {
  saving.value = true
  try {
    if (mode.value === 'create') {
      const created = await store.create(buildPayload('approved'))
      showToast(t('linkedinPosts.toasts.approved'))
      setTimeout(() => router.replace({ name: 'admin-linkedin-edit', params: { id: created.id } }), 600)
    } else {
      const id = route.params.id as string
      await updatePost(id, buildPayload('approved'))
      if (existingPost.value) existingPost.value.status = 'approved'
      showToast(t('linkedinPosts.toasts.approved'))
    }
  } catch {
    showToast(t('linkedinPosts.toasts.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}

async function handleCopy() {
  const plain = new DOMParser()
    .parseFromString(form.value.content, 'text/html')
    .body.innerText
  await navigator.clipboard.writeText(plain)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function handleArchive() {
  showArchiveConfirm.value = false
  archiving.value = true
  try {
    const id = route.params.id as string
    await deletePost(id)
    showToast(t('linkedinPosts.toasts.archived'))
    setTimeout(() => router.push({ name: 'admin-linkedin' }), 800)
  } catch {
    showToast(t('linkedinPosts.toasts.archiveFailed'), 'error')
  } finally {
    archiving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/admin/linkedin"
          class="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← {{ t('linkedinPosts.back') }}
        </RouterLink>
        <span class="text-slate-300">|</span>
        <h2 class="text-xl font-semibold text-slate-800">
          {{ mode === 'create' ? t('linkedinPosts.titleCreate') : t('linkedinPosts.titleEdit') }}
        </h2>
        <LinkedInPostStatusBadge v-if="existingPost" :status="existingPost.status" />
      </div>
      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="mode === 'edit'"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
          :disabled="archiving"
          @click="showArchiveConfirm = true"
        >
          {{ archiving ? t('linkedinPosts.archiving') : t('linkedinPosts.archive') }}
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors disabled:opacity-50"
          :disabled="saving || !form.title || !form.content"
          @click="handleApprove"
        >
          {{ saving ? t('linkedinPosts.saving') : t('linkedinPosts.approve') }}
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          :disabled="saving || !form.title || !form.content"
          @click="handleSaveDraft"
        >
          {{ saving ? t('linkedinPosts.saving') : t('linkedinPosts.saveDraft') }}
        </button>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="fade">
      <div
        v-if="toast"
        class="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
        :class="toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'"
      >
        {{ toast.msg }}
      </div>
    </Transition>

    <!-- Form -->
    <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
      <!-- Title -->
      <div class="px-6 py-4 space-y-1">
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {{ t('linkedinPosts.fields.title') }} <span class="text-red-400">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          :placeholder="t('linkedinPosts.fields.titlePlaceholder')"
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-1">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {{ t('linkedinPosts.fields.content') }} <span class="text-red-400">*</span>
          </label>
          <button
            type="button"
            :disabled="!form.content"
            class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-40"
            :class="copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'"
            @click="handleCopy"
          >
            <span v-if="copied">✓ {{ t('linkedinPosts.fields.copied') }}</span>
            <span v-else>{{ t('linkedinPosts.fields.copyContent') }}</span>
          </button>
        </div>
        <ArticleRichTextEditor v-model="form.content" />
        <p class="text-xs text-slate-400">{{ t('linkedinPosts.fields.contentHint') }}</p>
      </div>

      <!-- Serie + Episode -->
      <div class="px-6 py-4 grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {{ t('linkedinPosts.fields.serie') }}
          </label>
          <input
            v-model="form.serie"
            type="text"
            :placeholder="t('linkedinPosts.fields.seriePlaceholder')"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {{ t('linkedinPosts.fields.episode') }}
          </label>
          <input
            v-model="form.episode"
            type="number"
            min="1"
            :placeholder="t('linkedinPosts.fields.episodePlaceholder')"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <!-- Hashtags -->
      <div class="px-6 py-4 space-y-1">
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {{ t('linkedinPosts.fields.hashtags') }}
        </label>
        <input
          v-model="form.hashtags"
          type="text"
          :placeholder="t('linkedinPosts.fields.hashtagsPlaceholder')"
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <!-- Scheduled for + Published at -->
      <div class="px-6 py-4 grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {{ t('linkedinPosts.fields.scheduledFor') }}
          </label>
          <input
            v-model="form.scheduledFor"
            type="datetime-local"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p class="text-xs text-slate-400">{{ t('linkedinPosts.fields.scheduledForHint') }}</p>
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {{ t('linkedinPosts.fields.publishedAt') }}
          </label>
          <input
            v-model="form.publishedAt"
            type="datetime-local"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p class="text-xs text-slate-400">{{ t('linkedinPosts.fields.publishedAtHint') }}</p>
        </div>
      </div>

      <!-- Engagement notes -->
      <div class="px-6 py-4 space-y-1">
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {{ t('linkedinPosts.fields.engagementNotes') }}
        </label>
        <textarea
          v-model="form.engagementNotes"
          rows="4"
          :placeholder="t('linkedinPosts.fields.engagementNotesPlaceholder')"
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
        />
      </div>
    </div>

    <!-- Archive confirm dialog -->
    <Teleport to="body">
      <div
        v-if="showArchiveConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showArchiveConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h3 class="font-semibold text-slate-800">{{ t('linkedinPosts.archiveConfirm.title') }}</h3>
          <p class="text-sm text-slate-500">{{ t('linkedinPosts.archiveConfirm.body') }}</p>
          <div class="flex justify-end gap-2">
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              @click="showArchiveConfirm = false"
            >
              {{ t('linkedinPosts.archiveConfirm.cancel') }}
            </button>
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              @click="handleArchive"
            >
              {{ t('linkedinPosts.archiveConfirm.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
