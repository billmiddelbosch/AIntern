<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOnboarding } from '@/composables/useOnboarding'
import type { OnboardingEntry } from '@/types/onboarding'

const { t } = useI18n()
const router = useRouter()
const { fetchOnboardingList, createOnboardingEntry } = useOnboarding()

const entries = ref<OnboardingEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const showModal = ref(false)
const modalClientName = ref('')
const modalCreatedBy = ref('')
const modalSubmitting = ref(false)
const modalError = ref<string | null>(null)

async function loadEntries(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    entries.value = await fetchOnboardingList()
  } catch (err: unknown) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

function openModal(): void {
  modalClientName.value = ''
  modalCreatedBy.value = ''
  modalError.value = null
  showModal.value = true
}

function closeModal(): void {
  showModal.value = false
}

async function submitNewClient(): Promise<void> {
  if (!modalClientName.value.trim()) return
  modalSubmitting.value = true
  modalError.value = null
  try {
    const entry = await createOnboardingEntry(
      modalClientName.value.trim(),
      modalCreatedBy.value.trim() || 'admin',
    )
    closeModal()
    router.push({ name: 'admin-onboarding-detail', params: { clientId: entry.clientId } })
  } catch (err: unknown) {
    modalError.value = (err as Error).message
  } finally {
    modalSubmitting.value = false
  }
}

function progressLabel(entry: OnboardingEntry): string {
  const done = entry.items.filter((i) => i.done).length
  return `${done}/10`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

onMounted(loadEntries)
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('onboarding.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('onboarding.subheading') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="loadEntries"
        >
          {{ loading ? t('onboarding.loading') : t('onboarding.refresh') }}
        </button>
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          @click="openModal"
        >
          {{ t('onboarding.newClient') }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
    >
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && entries.length === 0" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-12 bg-slate-100 rounded-lg animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && entries.length === 0"
      class="flex flex-col items-center justify-center py-16 text-slate-400"
    >
      <p class="text-sm">{{ t('onboarding.empty') }}</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">
              {{ t('onboarding.columns.clientName') }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">
              {{ t('onboarding.columns.createdAt') }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">
              {{ t('onboarding.columns.progress') }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">
              {{ t('onboarding.columns.status') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.clientId"
            class="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
            @click="router.push({ name: 'admin-onboarding-detail', params: { clientId: entry.clientId } })"
          >
            <td class="px-4 py-3 font-medium text-slate-800">{{ entry.clientName }}</td>
            <td class="px-4 py-3 text-slate-500">{{ formatDate(entry.createdAt) }}</td>
            <td class="px-4 py-3 text-slate-700 font-mono">{{ progressLabel(entry) }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  entry.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700',
                ]"
              >
                {{ t(`onboarding.status.${entry.status}`) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- New client modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">
            {{ t('onboarding.modal.title') }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ t('onboarding.modal.clientNameLabel') }}
              </label>
              <input
                v-model="modalClientName"
                type="text"
                :placeholder="t('onboarding.modal.clientNamePlaceholder')"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keydown.enter="submitNewClient"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ t('onboarding.modal.createdByLabel') }}
              </label>
              <input
                v-model="modalCreatedBy"
                type="text"
                :placeholder="t('onboarding.modal.createdByPlaceholder')"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keydown.enter="submitNewClient"
              />
            </div>
          </div>

          <div v-if="modalError" class="mt-3 text-sm text-red-600">{{ modalError }}</div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300
                     hover:bg-slate-50 text-slate-700 transition-colors"
              @click="closeModal"
            >
              {{ t('onboarding.modal.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700
                     text-white transition-colors disabled:opacity-50"
              :disabled="modalSubmitting || !modalClientName.trim()"
              @click="submitNewClient"
            >
              {{ modalSubmitting ? t('onboarding.modal.submitting') : t('onboarding.modal.submit') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
