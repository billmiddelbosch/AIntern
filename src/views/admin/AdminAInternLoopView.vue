<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAInternLoopApi } from '@/composables/useAInternLoopApi'
import type { ActionItem } from '@/types/ainternloop'

type Tab = 'issues' | 'agents' | 'acties' | 'topics'

const { t } = useI18n()
const activeTab = ref<Tab>('issues')

const {
  loadingIssues,
  loadingAgents,
  loadingActions,
  loadingPriorityTopics,
  error,
  issues,
  agents,
  actions,
  priorityTopics,
  fetchIssues,
  closeIssue,
  fetchAgents,
  updateAgentInstruction,
  fetchActions,
  fetchActionDetail,
  updateAction,
  fetchPriorityTopics,
  updatePriorityTopics,
} = useAInternLoopApi()

const expandedIssue = ref<string | null>(null)
const closingIssue = ref<string | null>(null)
const editingAgent = ref<string | null>(null)
const editInstruction = ref('')
const savingAgent = ref<string | null>(null)

// artikelUrl originates from RSS <link> and is stored/rendered verbatim — validate scheme before use as href.
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

const ACTION_STATUSES = ['open', 'in_progress', 'on_hold', 'completed'] as const
const filterStatus = ref('')
const filterAgent = ref('')
const expandedAction = ref<string | null>(null)
const loadingActionDetail = ref<string | null>(null)
const actionDetails = ref<Record<string, ActionItem>>({})
const editingAction = ref<string | null>(null)
const editUrgency = ref(1)
const editTopLezersvraag = ref('')
const savingAction = ref<string | null>(null)
const cancellingAction = ref<string | null>(null)

const agentOptions = computed(() => {
  const names = new Set<string>()
  for (const a of agents.value) names.add(a.agentName)
  for (const act of actions.value) {
    names.add(act.sourceAgent)
    names.add(act.targetAgent)
  }
  return Array.from(names).sort()
})

const newTopicText = ref('')
const editableTopics = ref<string[]>([])
const savingTopics = ref(false)

function toggleIssue(issueId: string) {
  expandedIssue.value = expandedIssue.value === issueId ? null : issueId
}

async function handleCloseIssue(issueId: string) {
  closingIssue.value = issueId
  try {
    await closeIssue(issueId)
    await fetchIssues()
  } finally {
    closingIssue.value = null
    if (expandedIssue.value === issueId) expandedIssue.value = null
  }
}

function startEditAgent(agentName: string, currentInstruction: string) {
  editingAgent.value = agentName
  editInstruction.value = currentInstruction
}

function cancelEditAgent() {
  editingAgent.value = null
  editInstruction.value = ''
}

async function handleSaveAgent(agentName: string) {
  savingAgent.value = agentName
  try {
    await updateAgentInstruction(agentName, editInstruction.value)
    await fetchAgents()
    editingAgent.value = null
  } finally {
    savingAgent.value = null
  }
}

function currentActionFilters(): { status?: string; agent?: string } {
  const filters: { status?: string; agent?: string } = {}
  if (filterStatus.value) filters.status = filterStatus.value
  if (filterAgent.value) filters.agent = filterAgent.value
  return filters
}

async function handleFilterChange() {
  expandedAction.value = null
  await fetchActions(currentActionFilters())
}

async function toggleAction(actionId: string) {
  if (expandedAction.value === actionId) {
    expandedAction.value = null
    return
  }
  expandedAction.value = actionId
  if (!actionDetails.value[actionId]) {
    loadingActionDetail.value = actionId
    try {
      actionDetails.value[actionId] = await fetchActionDetail(actionId)
    } finally {
      loadingActionDetail.value = null
    }
  }
}

function startEditAction(action: ActionItem) {
  editingAction.value = action.actionId
  editUrgency.value = action.urgency
  const detail = actionDetails.value[action.actionId]
  editTopLezersvraag.value = (detail?.payload?.['topLezersvraag'] as string | undefined) ?? ''
}

function cancelEditAction() {
  editingAction.value = null
}

async function handleSaveAction(actionId: string) {
  savingAction.value = actionId
  try {
    await updateAction(actionId, {
      urgency: editUrgency.value,
      payload: editTopLezersvraag.value.trim()
        ? { topLezersvraag: editTopLezersvraag.value.trim() }
        : undefined,
    })
    delete actionDetails.value[actionId]
    await fetchActions(currentActionFilters())
    if (expandedAction.value === actionId) {
      actionDetails.value[actionId] = await fetchActionDetail(actionId)
    }
    editingAction.value = null
  } finally {
    savingAction.value = null
  }
}

async function handleCancelAction(actionId: string) {
  cancellingAction.value = actionId
  try {
    await updateAction(actionId, { status: 'cancelled' })
    await fetchActions(currentActionFilters())
  } finally {
    cancellingAction.value = null
    if (expandedAction.value === actionId) expandedAction.value = null
    if (editingAction.value === actionId) editingAction.value = null
  }
}

async function loadTopics() {
  await fetchPriorityTopics()
  editableTopics.value = [...priorityTopics.value]
}

function addTopic() {
  const value = newTopicText.value.trim()
  if (!value) return
  if (!editableTopics.value.includes(value)) editableTopics.value.push(value)
  newTopicText.value = ''
}

function removeTopic(topic: string) {
  editableTopics.value = editableTopics.value.filter((t) => t !== topic)
}

async function handleSaveTopics() {
  savingTopics.value = true
  try {
    await updatePriorityTopics(editableTopics.value)
    editableTopics.value = [...priorityTopics.value]
  } finally {
    savingTopics.value = false
  }
}

function selectTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'issues' && issues.value.length === 0) fetchIssues()
  if (tab === 'agents' && agents.value.length === 0) fetchAgents()
  if (tab === 'acties') {
    if (actions.value.length === 0) fetchActions(currentActionFilters())
    if (agents.value.length === 0) fetchAgents()
  }
  if (tab === 'topics' && priorityTopics.value.length === 0) loadTopics()
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'open': return 'bg-amber-100 text-amber-700'
    case 'escalated': return 'bg-red-100 text-red-700'
    case 'resolving': return 'bg-blue-100 text-blue-700'
    case 'closed': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-500'
  }
}

function actionStatusBadgeClass(status: string): string {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-700'
    case 'in_progress': return 'bg-indigo-100 text-indigo-700'
    case 'on_hold': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-500'
  }
}

function systemBadgeClass(system: string): string {
  return system === 'NewsFlow'
    ? 'bg-violet-100 text-violet-700'
    : 'bg-indigo-100 text-indigo-700'
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(() => fetchIssues())
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">{{ t('admin.ainternloop.heading') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('admin.ainternloop.subheading') }}</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in (['issues', 'agents', 'acties', 'topics'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="selectTab(tab)"
      >
        {{ t(`admin.ainternloop.tabs.${tab}`) }}
      </button>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- ── Issues tab ───────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'issues'">
      <div v-if="loadingIssues" class="py-12 text-center text-slate-400 text-sm">
        {{ t('admin.ainternloop.loading') }}
      </div>
      <div v-else-if="issues.length === 0" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
        {{ t('admin.ainternloop.issues.empty') }}
      </div>
      <div v-else class="overflow-hidden rounded-xl border border-slate-200">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th class="px-4 py-3">{{ t('admin.ainternloop.issues.cols.status') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.issues.cols.agent') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.issues.cols.description') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.issues.cols.created') }}</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="issue in issues" :key="issue.issueId">
              <tr
                class="hover:bg-slate-50 cursor-pointer transition-colors"
                @click="toggleIssue(issue.issueId)"
              >
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusBadgeClass(issue.status)"
                  >{{ issue.status }}</span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ issue.agentName }}</td>
                <td class="px-4 py-3 text-slate-700">{{ truncate(issue.description, 80) }}</td>
                <td class="px-4 py-3 text-slate-400 whitespace-nowrap">{{ formatDate(issue.createdAt) }}</td>
                <td class="px-4 py-3 text-right">
                  <span class="text-slate-300 text-xs">{{ expandedIssue === issue.issueId ? '▲' : '▼' }}</span>
                </td>
              </tr>
              <tr v-if="expandedIssue === issue.issueId" :key="`${issue.issueId}-detail`">
                <td colspan="5" class="px-4 pb-4 bg-slate-50">
                  <div class="space-y-3 pt-2">
                    <div v-if="issue.errorContext">
                      <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.issues.detail.errorContext') }}</p>
                      <pre class="text-xs bg-white border border-slate-200 rounded p-2 overflow-x-auto text-slate-700">{{ JSON.stringify(issue.errorContext, null, 2) }}</pre>
                    </div>
                    <div v-if="issue.resolutionApproach">
                      <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.issues.detail.resolution') }}</p>
                      <p class="text-sm text-slate-700">{{ issue.resolutionApproach }}</p>
                    </div>
                    <div v-if="issue.instructionToAgent">
                      <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.issues.detail.instruction') }}</p>
                      <p class="text-sm text-slate-700">{{ issue.instructionToAgent }}</p>
                    </div>
                    <div v-if="issue.status !== 'closed'">
                      <button
                        class="mt-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        :disabled="closingIssue === issue.issueId"
                        @click.stop="handleCloseIssue(issue.issueId)"
                      >
                        {{ closingIssue === issue.issueId ? t('admin.ainternloop.issues.closing') : t('admin.ainternloop.issues.close') }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Agents tab ──────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'agents'">
      <div v-if="loadingAgents" class="py-12 text-center text-slate-400 text-sm">
        {{ t('admin.ainternloop.loading') }}
      </div>
      <div v-else-if="agents.length === 0" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
        {{ t('admin.ainternloop.agents.empty') }}
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="agent in agents"
          :key="agent.agentName"
          class="rounded-xl border border-slate-200 p-4 space-y-3 bg-white"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium text-slate-800">{{ agent.displayName }}</p>
              <p class="text-xs text-slate-400 mt-0.5">v{{ agent.instructionVersion }} · {{ t('admin.ainternloop.agents.modifiedBy') }}: {{ agent.lastModifiedBy }}</p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
              :class="systemBadgeClass(agent.system)"
            >{{ agent.system }}</span>
          </div>

          <template v-if="editingAgent === agent.agentName">
            <textarea
              v-model="editInstruction"
              rows="6"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
            <div class="flex gap-2">
              <button
                class="rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                :disabled="savingAgent === agent.agentName"
                @click="handleSaveAgent(agent.agentName)"
              >
                {{ savingAgent === agent.agentName ? t('admin.ainternloop.agents.saving') : t('admin.ainternloop.agents.save') }}
              </button>
              <button
                class="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                @click="cancelEditAgent"
              >
                {{ t('admin.ainternloop.agents.cancel') }}
              </button>
            </div>
          </template>
          <template v-else>
            <p class="text-xs text-slate-500 line-clamp-3">{{ agent.instruction }}</p>
            <button
              class="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              @click="startEditAgent(agent.agentName, agent.instruction)"
            >
              {{ t('admin.ainternloop.agents.edit') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Acties tab ──────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'acties'" class="space-y-4">
      <div class="flex flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-slate-500">{{ t('admin.ainternloop.actions.filters.status') }}</label>
          <select
            v-model="filterStatus"
            class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @change="handleFilterChange"
          >
            <option value="">{{ t('admin.ainternloop.actions.filters.all') }}</option>
            <option v-for="s in ACTION_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-slate-500">{{ t('admin.ainternloop.actions.filters.agent') }}</label>
          <select
            v-model="filterAgent"
            class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @change="handleFilterChange"
          >
            <option value="">{{ t('admin.ainternloop.actions.filters.all') }}</option>
            <option v-for="a in agentOptions" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>

      <div v-if="loadingActions" class="py-12 text-center text-slate-400 text-sm">
        {{ t('admin.ainternloop.loading') }}
      </div>
      <div v-else-if="actions.length === 0" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
        {{ t('admin.ainternloop.actions.empty') }}
      </div>
      <div v-else class="overflow-hidden rounded-xl border border-slate-200">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.type') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.status') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.urgency') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.source') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.target') }}</th>
              <th class="px-4 py-3">{{ t('admin.ainternloop.actions.cols.created') }}</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="action in actions" :key="action.actionId">
              <tr
                class="hover:bg-slate-50 cursor-pointer transition-colors"
                @click="toggleAction(action.actionId)"
              >
                <td class="px-4 py-3 text-slate-700 font-mono text-xs">{{ action.type }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="actionStatusBadgeClass(action.status)"
                  >{{ action.status }}</span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ action.urgency }}</td>
                <td class="px-4 py-3 text-slate-500">{{ action.sourceAgent }}</td>
                <td class="px-4 py-3 text-slate-500">{{ action.targetAgent }}</td>
                <td class="px-4 py-3 text-slate-400 whitespace-nowrap">{{ formatDate(action.createdAt) }}</td>
                <td class="px-4 py-3 text-right">
                  <span class="text-slate-300 text-xs">{{ expandedAction === action.actionId ? '▲' : '▼' }}</span>
                </td>
              </tr>
              <tr v-if="expandedAction === action.actionId" :key="`${action.actionId}-detail`">
                <td colspan="7" class="px-4 pb-4 bg-slate-50">
                  <div v-if="loadingActionDetail === action.actionId" class="pt-3 text-xs text-slate-400">
                    {{ t('admin.ainternloop.loading') }}
                  </div>
                  <div v-else class="space-y-3 pt-2">
                    <template v-if="editingAction === action.actionId">
                      <div>
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.cols.urgency') }}</p>
                        <input
                          v-model.number="editUrgency"
                          type="number"
                          min="1"
                          max="100"
                          class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.topLezersvraag') }}</p>
                        <textarea
                          v-model="editTopLezersvraag"
                          rows="3"
                          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                        />
                      </div>
                      <div class="flex gap-2">
                        <button
                          class="rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          :disabled="savingAction === action.actionId"
                          @click.stop="handleSaveAction(action.actionId)"
                        >
                          {{ savingAction === action.actionId ? t('admin.ainternloop.actions.saving') : t('admin.ainternloop.actions.save') }}
                        </button>
                        <button
                          class="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                          @click.stop="cancelEditAction"
                        >
                          {{ t('admin.ainternloop.actions.cancel') }}
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <div v-if="actionDetails[action.actionId]?.payload?.['topLezersvraag']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.topLezersvraag') }}</p>
                        <p class="text-sm text-slate-700">{{ actionDetails[action.actionId]?.payload?.['topLezersvraag'] }}</p>
                      </div>
                      <div v-if="(actionDetails[action.actionId]?.payload?.['lezersvragen'] as string[] | undefined)?.length">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.lezersvragen') }}</p>
                        <ul class="text-sm text-slate-700 list-disc list-inside space-y-0.5">
                          <li v-for="(vraag, idx) in (actionDetails[action.actionId]?.payload?.['lezersvragen'] as string[])" :key="idx">{{ vraag }}</li>
                        </ul>
                      </div>
                      <div v-if="actionDetails[action.actionId]?.payload?.['artikelTitel']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.artikelTitel') }}</p>
                        <p class="text-sm text-slate-700">{{ actionDetails[action.actionId]?.payload?.['artikelTitel'] }}</p>
                      </div>
                      <div v-if="actionDetails[action.actionId]?.payload?.['artikelUrl']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.artikelUrl') }}</p>
                        <a
                          v-if="isSafeUrl(actionDetails[action.actionId]?.payload?.['artikelUrl'] as string)"
                          :href="actionDetails[action.actionId]?.payload?.['artikelUrl'] as string"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-indigo-600 hover:text-indigo-800 break-all"
                          @click.stop
                        >{{ actionDetails[action.actionId]?.payload?.['artikelUrl'] }}</a>
                        <span v-else class="text-sm text-slate-500 break-all">{{ actionDetails[action.actionId]?.payload?.['artikelUrl'] }}</span>
                      </div>
                      <div v-if="actionDetails[action.actionId]?.payload?.['urgencyReason']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.urgencyReason') }}</p>
                        <p class="text-sm text-slate-700">{{ actionDetails[action.actionId]?.payload?.['urgencyReason'] }}</p>
                      </div>
                      <div v-if="actionDetails[action.actionId]?.payload?.['rssSource']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.rssSource') }}</p>
                        <p class="text-sm text-slate-700">{{ actionDetails[action.actionId]?.payload?.['rssSource'] }}</p>
                      </div>
                      <div v-if="actionDetails[action.actionId]?.payload?.['publishedAt']">
                        <p class="text-xs font-medium text-slate-500 mb-1">{{ t('admin.ainternloop.actions.detail.publishedAt') }}</p>
                        <p class="text-sm text-slate-700">{{ formatDate(actionDetails[action.actionId]?.payload?.['publishedAt'] as string) }}</p>
                      </div>
                      <div v-if="action.status === 'open'" class="flex gap-2 pt-1">
                        <button
                          class="rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          @click.stop="startEditAction(action)"
                        >
                          {{ t('admin.ainternloop.actions.edit') }}
                        </button>
                        <button
                          class="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                          :disabled="cancellingAction === action.actionId"
                          @click.stop="handleCancelAction(action.actionId)"
                        >
                          {{ cancellingAction === action.actionId ? t('admin.ainternloop.actions.cancelling') : t('admin.ainternloop.actions.cancelAction') }}
                        </button>
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Onderwerpen tab ─────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'topics'" class="space-y-4">
      <div v-if="loadingPriorityTopics" class="py-12 text-center text-slate-400 text-sm">
        {{ t('admin.ainternloop.loading') }}
      </div>
      <div v-else class="space-y-4">
        <div v-if="editableTopics.length === 0" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
          {{ t('admin.ainternloop.topics.empty') }}
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <span
            v-for="topic in editableTopics"
            :key="topic"
            class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm"
          >
            {{ topic }}
            <button
              class="text-indigo-400 hover:text-indigo-700"
              :aria-label="t('admin.ainternloop.topics.remove')"
              @click="removeTopic(topic)"
            >×</button>
          </span>
        </div>

        <div class="flex gap-2">
          <input
            v-model="newTopicText"
            type="text"
            :placeholder="t('admin.ainternloop.topics.addPlaceholder')"
            class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @keyup.enter="addTopic"
          />
          <button
            class="rounded-lg px-3 py-2 text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            @click="addTopic"
          >
            {{ t('admin.ainternloop.topics.add') }}
          </button>
        </div>

        <button
          class="rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          :disabled="savingTopics"
          @click="handleSaveTopics"
        >
          {{ savingTopics ? t('admin.ainternloop.topics.saving') : t('admin.ainternloop.topics.save') }}
        </button>
      </div>
    </div>
  </div>
</template>
