<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOnboarding } from '@/composables/useOnboarding'
import type { OnboardingEntry, ChecklistItemId } from '@/types/onboarding'

const { t } = useI18n()
const route = useRoute()
const { fetchOnboardingEntry, toggleChecklistItem } = useOnboarding()

const clientId = route.params['clientId'] as string

const entry = ref<OnboardingEntry | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const togglingItem = ref<string | null>(null)

async function loadEntry(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    entry.value = await fetchOnboardingEntry(clientId)
  } catch (err: unknown) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

async function toggleItem(itemId: ChecklistItemId): Promise<void> {
  if (togglingItem.value) return
  togglingItem.value = itemId
  try {
    entry.value = await toggleChecklistItem(clientId, itemId)
  } catch (err: unknown) {
    error.value = (err as Error).message
  } finally {
    togglingItem.value = null
  }
}

function doneCount(): number {
  return entry.value?.items.filter((i) => i.done).length ?? 0
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadEntry)
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Back link -->
    <div class="mb-6">
      <RouterLink
        :to="{ name: 'admin-onboarding' }"
        class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        {{ t('onboarding.detail.backToList') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="h-10 w-64 bg-slate-100 rounded-lg animate-pulse" />
      <div v-for="n in 10" :key="n" class="h-14 bg-slate-100 rounded-xl animate-pulse" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
    >
      {{ error }}
    </div>

    <template v-else-if="entry">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <h2 class="text-2xl font-semibold text-slate-800">{{ entry.clientName }}</h2>
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            entry.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700',
          ]"
        >
          {{ t(`onboarding.status.${entry.status}`) }}
        </span>
      </div>
      <p class="text-sm text-slate-500 mb-6">
        {{ t('onboarding.detail.progress', { done: doneCount(), total: 10 }) }}
      </p>

      <!-- Checklist -->
      <div class="space-y-2">
        <div
          v-for="item in entry.items"
          :key="item.id"
          :class="[
            'flex items-start gap-4 px-4 py-3 rounded-xl border transition-colors',
            item.done
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-slate-200 hover:border-slate-300',
          ]"
        >
          <button
            :disabled="togglingItem === item.id"
            class="mt-0.5 flex-shrink-0 disabled:opacity-50 cursor-pointer"
            @click="toggleItem(item.id)"
          >
            <!-- Checked box -->
            <svg
              v-if="item.done"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-green-600"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <!-- Unchecked box -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-300"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <p
              :class="[
                'text-sm font-medium',
                item.done ? 'text-green-800 line-through' : 'text-slate-800',
              ]"
            >
              {{ item.label }}
            </p>
            <p v-if="item.done && item.completedAt" class="text-xs text-green-600 mt-0.5">
              {{ t('onboarding.detail.completedAt', { time: formatDateTime(item.completedAt) }) }}
            </p>
            <p v-else-if="!item.done" class="text-xs text-slate-400 mt-0.5">
              {{ t('onboarding.detail.notDone') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
