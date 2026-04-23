<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLeadStore } from '@/stores/useLeadStore'
import { LEAD_STATUSES } from '@/types/lead'
import type { Lead, LeadStatus } from '@/types/lead'

const { t } = useI18n()
const route = useRoute()
const store = useLeadStore()

const id = route.params.id as string

const form = reactive({
  linkedinUrl: '',
  linkedinName: '',
  status: 'new' as LeadStatus,
  notes: '',
  connectionMessage: '',
  dmMessage: '',
})

const saving = ref(false)
const savedMsg = ref(false)
const errorMsg = ref<string | null>(null)

const copiedConnectionMessage = ref(false)
const copiedDmMessage = ref(false)

onMounted(async () => {
  await store.fetchLeadByIdAction(id)
  const lead = store.selectedLead
  if (lead) {
    form.linkedinUrl = lead.linkedinUrl ?? ''
    form.linkedinName = lead.linkedinName ?? ''
    form.status = lead.status
    form.notes = lead.notes ?? ''
    form.connectionMessage = lead.connectionMessage ?? ''
    form.dmMessage = lead.dmMessage ?? ''
  }
})

async function handleSave(): Promise<void> {
  saving.value = true
  errorMsg.value = null
  try {
    const fields: Partial<Lead> = {
      linkedinUrl: form.linkedinUrl || undefined,
      linkedinName: form.linkedinName || undefined,
      status: form.status,
      notes: form.notes || undefined,
      connectionMessage: form.connectionMessage || undefined,
      dmMessage: form.dmMessage || undefined,
    }
    await store.updateLeadAction(id, fields)
    savedMsg.value = true
    setTimeout(() => (savedMsg.value = false), 2000)
  } catch (err: unknown) {
    errorMsg.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

async function copyText(text: string, setFlag: (v: boolean) => void): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    setFlag(true)
    setTimeout(() => setFlag(false), 2000)
  } catch {
    // clipboard not available
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4 space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <RouterLink
        :to="{ name: 'admin-leads' }"
        class="text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        {{ t('leads.form.back') }}
      </RouterLink>
      <h1 class="text-xl font-semibold text-slate-800">{{ t('leads.form.heading') }}</h1>
    </div>

    <!-- Not found -->
    <div v-if="!store.loading && !store.selectedLead" class="text-center py-16 space-y-3">
      <p class="text-slate-500">{{ t('leads.form.notFound') }}</p>
      <RouterLink :to="{ name: 'admin-leads' }" class="text-sm text-indigo-600 hover:underline">
        {{ t('leads.form.back') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-else-if="store.loading" class="text-center py-16 text-slate-400 text-sm">
      Loading…
    </div>

    <template v-else-if="store.selectedLead">
      <!-- Read-only info -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <!-- Website -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.website') }}
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-800">{{ store.selectedLead.website }}</span>
            <a
              :href="`https://${store.selectedLead.website}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-indigo-600 hover:underline"
            >↗</a>
          </div>
        </div>

        <!-- LinkedIn URL -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.linkedinUrl') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="form.linkedinUrl"
              type="url"
              class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="https://www.linkedin.com/in/…"
            />
            <a
              v-if="form.linkedinUrl"
              :href="form.linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-indigo-600 hover:underline whitespace-nowrap"
            >
              {{ t('leads.form.openLinkedIn') }}
            </a>
          </div>
        </div>

        <!-- LinkedIn Name -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.linkedinName') }}
          </label>
          <input
            v-model="form.linkedinName"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.status') }}
          </label>
          <select
            v-model="form.status"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option v-for="s in LEAD_STATUSES" :key="s" :value="s">
              {{ t(`leads.status.${s}`) }}
            </option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.notes') }}
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      <!-- Outreach section -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-slate-700">Outreach</h2>

        <!-- Connection Sent At (read-only) -->
        <div v-if="store.selectedLead.connectionSentAt">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.connectionSentAt') }}
          </label>
          <span class="text-sm text-slate-800">{{ store.selectedLead.connectionSentAt }}</span>
        </div>

        <!-- Connection Variant (read-only badge) -->
        <div v-if="store.selectedLead.connectionVariant">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.connectionVariant') }}
          </label>
          <span class="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {{ store.selectedLead.connectionVariant }}
          </span>
        </div>

        <!-- Connection Message (editable + copy) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-slate-500">
              {{ t('leads.form.connectionMessage') }}
            </label>
            <button
              v-if="form.connectionMessage"
              type="button"
              class="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              @click="copyText(form.connectionMessage, v => (copiedConnectionMessage = v))"
            >
              {{ copiedConnectionMessage ? t('leads.form.copied') : t('leads.form.copy') }}
            </button>
          </div>
          <textarea
            v-model="form.connectionMessage"
            rows="4"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <!-- DM Sent At (read-only) -->
        <div v-if="store.selectedLead.dmSentAt">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.dmSentAt') }}
          </label>
          <span class="text-sm text-slate-800">{{ store.selectedLead.dmSentAt }}</span>
        </div>

        <!-- DM Variant (read-only badge) -->
        <div v-if="store.selectedLead.dmVariant">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.dmVariant') }}
          </label>
          <span class="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {{ store.selectedLead.dmVariant }}
          </span>
        </div>

        <!-- DM Message (editable + copy) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-slate-500">
              {{ t('leads.form.dmMessage') }}
            </label>
            <button
              v-if="form.dmMessage"
              type="button"
              class="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              @click="copyText(form.dmMessage, v => (copiedDmMessage = v))"
            >
              {{ copiedDmMessage ? t('leads.form.copied') : t('leads.form.copy') }}
            </button>
          </div>
          <textarea
            v-model="form.dmMessage"
            rows="4"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <!-- DM Response (read-only, only if present) -->
        <div v-if="store.selectedLead.dmResponse">
          <label class="block text-xs font-medium text-slate-500 mb-1">
            {{ t('leads.form.dmResponse') }}
          </label>
          <p class="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2">
            {{ store.selectedLead.dmResponse }}
          </p>
        </div>
      </div>

      <!-- Save actions -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          :disabled="saving"
          class="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="handleSave"
        >
          {{ saving ? t('leads.form.saving') : savedMsg ? t('leads.form.saved') : t('leads.form.save') }}
        </button>
        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
      </div>
    </template>
  </div>
</template>
