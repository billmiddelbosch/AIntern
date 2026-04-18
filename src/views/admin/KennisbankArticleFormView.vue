<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ArticleFormHeader from '@/components/admin/ArticleFormHeader.vue'
import ArticleMetaPanel from '@/components/admin/ArticleMetaPanel.vue'
import ArticleRichTextEditor from '@/components/admin/ArticleRichTextEditor.vue'
import { useKennisbankArticleEditor } from '@/composables/useKennisbankArticleEditor'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { form, loading, saving, publishing, deleting, error, loadArticle, saveDraft, publish, deleteArticle } =
  useKennisbankArticleEditor()

const mode = computed<'create' | 'edit'>(() =>
  route.name === 'admin-kennisbank-new' ? 'create' : 'edit',
)

const slugConflict = ref(false)
const slugChecking = ref(false)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
const showDeleteConfirm = ref(false)
const initialStatus = ref<'draft' | 'published'>('draft')
const hasUnsavedPublishedChanges = ref(false)

onMounted(async () => {
  if (mode.value === 'edit') {
    const slug = route.params.slug as string
    await loadArticle(slug)
    initialStatus.value = form.status
  }
})

watch(
  () => ({ ...form }),
  () => {
    if (mode.value === 'edit' && initialStatus.value === 'published') {
      hasUnsavedPublishedChanges.value = true
    }
  },
  { deep: true },
)

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  setTimeout(() => (toast.value = null), 3500)
}

async function handleSaveDraft() {
  try {
    await saveDraft()
    hasUnsavedPublishedChanges.value = false
    showToast(t('admin.articleForm.toasts.draftSaved'))
  } catch {
    showToast(t('admin.articleForm.toasts.saveFailed'), 'error')
  }
}

async function handlePublish() {
  try {
    await publish()
    hasUnsavedPublishedChanges.value = false
    initialStatus.value = 'published'
    showToast(t('admin.articleForm.toasts.published'))
  } catch {
    showToast(t('admin.articleForm.toasts.publishFailed'), 'error')
  }
}

async function handleDelete() {
  showDeleteConfirm.value = false
  try {
    await deleteArticle()
    showToast(t('admin.articleForm.toasts.deleted'))
    setTimeout(() => router.push({ name: 'admin-kennisbank' }), 800)
  } catch {
    showToast(t('admin.articleForm.toasts.deleteFailed'), 'error')
  }
}

function updateForm(updated: typeof form) {
  Object.assign(form, updated)
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
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

    <!-- Delete confirmation modal -->
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h3 class="text-lg font-semibold text-slate-800">{{ t('admin.articleForm.deleteConfirm.title') }}</h3>
          <p class="text-sm text-slate-500">{{ t('admin.articleForm.deleteConfirm.body') }}</p>
          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              @click="showDeleteConfirm = false"
            >{{ t('admin.articleForm.deleteConfirm.cancel') }}</button>
            <button
              class="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              @click="handleDelete"
            >{{ t('admin.articleForm.deleteConfirm.confirm') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Header -->
    <ArticleFormHeader
      :mode="mode"
      :status="form.status"
      :saving="saving"
      :publishing="publishing"
      :deleting="deleting"
      :has-unsaved-published-changes="hasUnsavedPublishedChanges"
      @save-draft="handleSaveDraft"
      @publish="handlePublish"
      @back="router.push({ name: 'admin-kennisbank' })"
      @delete="showDeleteConfirm = true"
    />

    <!-- Error banner -->
    <div
      v-if="error"
      class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="n in 4" :key="n" class="h-10 rounded-xl bg-slate-100 animate-pulse" />
    </div>

    <!-- Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      <!-- Rich text editor -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-600">
          {{ t('admin.articleForm.fields.content') }}
        </label>
        <ArticleRichTextEditor v-model="form.content" />
      </div>

      <!-- Meta panel -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <ArticleMetaPanel
          :form="form"
          :mode="mode"
          :slug-conflict="slugConflict"
          :slug-checking="slugChecking"
          @update:form="updateForm"
          @slug-conflict="(v) => (slugConflict = v)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
