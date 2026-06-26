<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAInternLoopApi } from '@/composables/useAInternLoopApi'

type Tab = 'issues' | 'agents' | 'acties'

const { t } = useI18n()
const activeTab = ref<Tab>('issues')

const {
  loadingIssues,
  loadingAgents,
  loadingActions,
  error,
  issues,
  agents,
  actions,
  fetchIssues,
  closeIssue,
  fetchAgents,
  updateAgentInstruction,
  fetchActions,
} = useAInternLoopApi()

const expandedIssue = ref<string | null>(null)
const closingIssue = ref<string | null>(null)
const editingAgent = ref<string | null>(null)
const editInstruction = ref('')
const savingAgent = ref<string | null>(null)

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

function selectTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'issues' && issues.value.length === 0) fetchIssues()
  if (tab === 'agents' && agents.value.length === 0) fetchAgents()
  if (tab === 'acties' && actions.value.length === 0) fetchActions()
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
        v-for="tab in (['issues', 'agents', 'acties'] as const)"
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
    <div v-else-if="activeTab === 'acties'">
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
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="action in actions"
              :key="action.actionId"
              class="hover:bg-slate-50 transition-colors"
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
