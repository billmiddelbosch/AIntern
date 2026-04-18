<script setup lang="ts">
import { computed } from 'vue'

interface Agent {
  name: string
  agentId: string
  emoji: string
  tier: 'clevel' | 'subagent'
  parentRole: string | null
  roleLabel: string
  tileColor: string
  responsibilities?: string[]
  triggeredBy: string
}

const PARENT_CHIP: Record<string, string> = {
  CEO: 'bg-indigo-50 text-indigo-700',
  CMO: 'bg-pink-50 text-pink-700',
  CTO: 'bg-teal-50 text-teal-700',
  COO: 'bg-violet-50 text-violet-700',
}

const PARENT_BORDER: Record<string, string> = {
  CEO: 'border-l-indigo-300',
  CMO: 'border-l-pink-300',
  CTO: 'border-l-teal-300',
  COO: 'border-l-violet-300',
}

const agents: Agent[] = [
  // C-level
  {
    name: 'Alex', agentId: 'ceo', emoji: '🧑‍💼', tier: 'clevel', parentRole: null,
    roleLabel: 'CEO', tileColor: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    responsibilities: [
      'Eindverantwoordelijkheid voor strategie en richting van AIntern',
      'Sales, klantrelaties en zakelijke partnerships',
      'Bewaking van de Q2 OKRs en rapportage aan het board',
    ],
    triggeredBy: 'Human Board',
  },
  {
    name: 'Blake', agentId: 'cmo', emoji: '📣', tier: 'clevel', parentRole: 'CEO',
    roleLabel: 'CMO', tileColor: 'bg-pink-50 text-pink-700 ring-pink-200',
    responsibilities: [
      'Contentmarketing, LinkedIn-presence en lead-generatie',
      'Kennisbank publicaties en campagnestrategie',
      'Merkpositionering en doelgroepbereik voor het MKB',
    ],
    triggeredBy: 'CEO (Alex)',
  },
  {
    name: 'Morgan', agentId: 'cto', emoji: '🔧', tier: 'clevel', parentRole: 'CEO',
    roleLabel: 'CTO', tileColor: 'bg-teal-50 text-teal-700 ring-teal-200',
    responsibilities: [
      'Technische architectuur van het platform en Lambda-functies',
      'Infrastructuur (AWS CDK), CI/CD en security',
      'Technische roadmap en sprint-planning',
    ],
    triggeredBy: 'CEO (Alex)',
  },
  {
    name: 'Sam', agentId: 'coo', emoji: '⚙️', tier: 'clevel', parentRole: 'CEO',
    roleLabel: 'COO', tileColor: 'bg-violet-50 text-violet-700 ring-violet-200',
    responsibilities: [
      'Operationele processen, kwaliteitsbewaking en SLA-naleving',
      'Klant-onboarding en projectdelivery',
      'Interne efficiëntie en tooling',
    ],
    triggeredBy: 'CEO (Alex)',
  },
  // CEO sub-agents
  { name: 'Backlog Manager', agentId: 'backlog-manager', emoji: '📋', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Backlog Manager', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — feature triage, sprint planning' },
  { name: 'General Purpose', agentId: 'general-purpose', emoji: '🤖', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Research Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — ad-hoc onderzoek' },
  { name: 'Plan', agentId: 'plan', emoji: '🗺️', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Architect', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — vision-to-spec bridge' },
  { name: 'Company Intel', agentId: 'company-intel', emoji: '🔍', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Intel Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — sales prep, partnership research' },
  { name: 'Product Vision', agentId: 'vision-1-product-vision', emoji: '🌟', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Vision Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — roadmap sessies' },
  { name: 'Product Roadmap', agentId: 'vision-2-product-roadmap', emoji: '🛣️', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Roadmap Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO — kwartaalplanning' },
  { name: 'Thought Journal', agentId: 'thought-journal', emoji: '📓', tier: 'subagent', parentRole: 'CEO', roleLabel: 'Journal Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CEO/CMO — content-ideatie' },
  // CMO sub-agents
  { name: 'Marketing Super Team', agentId: 'marketing-super-team', emoji: '🎯', tier: 'subagent', parentRole: 'CMO', roleLabel: '5-Expert Panel', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — campagnestrategie' },
  { name: 'Social Content', agentId: 'social-content', emoji: '📱', tier: 'subagent', parentRole: 'CMO', roleLabel: 'Content Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — contentkalender' },
  { name: 'Outreach', agentId: 'outreach', emoji: '📨', tier: 'subagent', parentRole: 'CMO', roleLabel: 'Outreach Agent', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — lead outreach' },
  { name: 'LinkedIn Outreach', agentId: 'linkedin-outreach', emoji: '🤝', tier: 'subagent', parentRole: 'CMO', roleLabel: 'LinkedIn Sequentie', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — connectiecampagnes' },
  { name: 'Lead Outreach', agentId: 'lead-outreach', emoji: '👥', tier: 'subagent', parentRole: 'CMO', roleLabel: 'Bulk Outreach', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — bulk lead verwerking' },
  { name: 'Apify Lead Gen', agentId: 'apify-lead-generation', emoji: '🕷️', tier: 'subagent', parentRole: 'CMO', roleLabel: 'Lead Scraper', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — lead sourcing' },
  { name: 'LinkedIn CLI', agentId: 'linkedin-cli', emoji: '🔗', tier: 'subagent', parentRole: 'CMO', roleLabel: 'LinkedIn CLI', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CMO — profiel lookups' },
  // CTO sub-agents
  { name: 'Vue.js Builder', agentId: 'vuejs-feature-builder', emoji: '🖼️', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Frontend Builder', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — frontend features' },
  { name: 'Vue Scaffolder', agentId: 'vuejs-project-scaffolder', emoji: '🏗️', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Project Setup', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — nieuwe projecten' },
  { name: 'Lambda Builder', agentId: 'lambda-feature-builder', emoji: '⚡', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Serverless Builder', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — backend features' },
  { name: 'DynamoDB Builder', agentId: 'dynamodb-feature-builder', emoji: '🗄️', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Data Modeler', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — data modeling' },
  { name: 'Code Reviewer', agentId: 'code-reviewer', emoji: '👁️', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Kwaliteitsreview', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — na elke codewijziging' },
  { name: 'Security Reviewer', agentId: 'security-reviewer', emoji: '🔒', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Security Audit', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — na input/API/auth code' },
  { name: 'Explore', agentId: 'explore', emoji: '🔎', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Codebase Explorer', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — onderzoeksvragen' },
  { name: 'UI Designer', agentId: 'ui-designer', emoji: '🎨', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Visueel Ontwerp', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — UI-taken' },
  { name: 'UX Designer', agentId: 'ux-designer', emoji: '🧭', tier: 'subagent', parentRole: 'CTO', roleLabel: 'UX Strategie', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — UX review' },
  { name: 'Plugin Dev Suite', agentId: 'plugin-dev', emoji: '🔌', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Plugin Suite', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — plugin development' },
  { name: 'Claude API', agentId: 'claude-api', emoji: '🤖', tier: 'subagent', parentRole: 'CTO', roleLabel: 'AI Integratie', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — AI integraties' },
  { name: 'Firecrawl', agentId: 'firecrawl', emoji: '🕸️', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Web Crawler', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — externe datavragen' },
  { name: 'Session Health', agentId: 'session-health', emoji: '📊', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Sessiegezondheid', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — lopende hygiëne' },
  { name: 'Simplify', agentId: 'simplify', emoji: '✨', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Codekwaliteit', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — refactoring' },
  { name: 'Init', agentId: 'init', emoji: '📄', tier: 'subagent', parentRole: 'CTO', roleLabel: 'Project Init', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — project setup' },
  { name: 'Review', agentId: 'review', emoji: '🔍', tier: 'subagent', parentRole: 'CTO', roleLabel: 'PR Review', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'CTO — PR workflow' },
  // COO sub-agents
  { name: 'Daily Board Meeting', agentId: 'daily-board-meeting', emoji: '📅', tier: 'subagent', parentRole: 'COO', roleLabel: 'Dagelijkse Standup', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'COO — elke ochtend' },
  { name: 'Schedule', agentId: 'schedule', emoji: '🕐', tier: 'subagent', parentRole: 'COO', roleLabel: 'Cron Planner', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'COO — automatiseringsplanning' },
  { name: 'Loop', agentId: 'loop', emoji: '🔁', tier: 'subagent', parentRole: 'COO', roleLabel: 'Herhalende Taken', tileColor: 'bg-slate-50 text-slate-700 ring-slate-200', triggeredBy: 'COO — polling, monitoringloops' },
]

const ceo = computed(() => agents.find((a) => a.parentRole === null)!)
const clevel = computed(() => agents.filter((a) => a.tier === 'clevel' && a.parentRole !== null))
const subAgentsByParent = computed(() => {
  const map: Record<string, Agent[]> = {}
  for (const a of agents) {
    if (a.tier === 'subagent' && a.parentRole) {
      if (!map[a.parentRole]) map[a.parentRole] = []
      map[a.parentRole].push(a)
    }
  }
  return map
})
const clevelAgents = computed(() => agents.filter((a) => a.tier === 'clevel'))
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <!-- Page header -->
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">Organisatie</h2>
      <p class="mt-1 text-sm text-slate-500">
        Overzicht van het volledige AIntern-agentteam — C-suite en sub-agents, rollen en hiërarchie.
      </p>
    </div>

    <!-- Hierarchy diagram -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">
        Organisatiehiërarchie
      </h3>

      <!-- CEO row -->
      <div class="flex flex-col items-center">
        <div class="flex flex-col items-center w-48">
          <div class="w-full text-center rounded-xl border border-slate-200 bg-indigo-50 px-4 py-3 shadow-sm">
            <div class="flex items-center justify-center gap-2">
              <span class="text-xl">{{ ceo.emoji }}</span>
              <p class="text-sm font-bold text-indigo-800">{{ ceo.name }}</p>
            </div>
            <span class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ring-1" :class="ceo.tileColor">
              {{ ceo.roleLabel }}
            </span>
          </div>
        </div>

        <!-- Connector -->
        <div class="w-px h-6 bg-slate-200" />

        <!-- C-level + sub-agent columns -->
        <div class="relative w-full max-w-3xl">
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-slate-200" />
          <div class="grid grid-cols-3 gap-4 w-full">
            <div v-for="agent in clevel" :key="agent.agentId" class="flex flex-col items-center">
              <div class="w-px h-6 bg-slate-200" />
              <!-- C-level card -->
              <div class="w-full text-center rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div class="flex items-center justify-center gap-2">
                  <span class="text-xl">{{ agent.emoji }}</span>
                  <p class="text-sm font-bold text-slate-800">{{ agent.name }}</p>
                </div>
                <span class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ring-1" :class="agent.tileColor">
                  {{ agent.roleLabel }}
                </span>
              </div>
              <!-- Sub-agent chips -->
              <div v-if="subAgentsByParent[agent.roleLabel]" class="w-full mt-2">
                <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span
                    v-for="sub in subAgentsByParent[agent.roleLabel]"
                    :key="sub.agentId"
                    class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    :class="PARENT_CHIP[agent.roleLabel]"
                  >
                    <span>{{ sub.emoji }}</span>
                    <span class="hidden sm:inline">{{ sub.name }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- C-Suite detail cards -->
    <div>
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">C-Suite</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="agent in clevelAgents"
          :key="agent.agentId"
          class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl text-xl" :class="agent.tileColor.split(' ').find(c => c.startsWith('bg-'))">
                {{ agent.emoji }}
              </div>
              <div>
                <p class="text-base font-semibold text-slate-800">{{ agent.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ agent.parentRole ? `Rapporteert aan: ${agent.parentRole}` : 'Eindverantwoordelijke' }}
                </p>
              </div>
            </div>
            <span class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ring-1" :class="agent.tileColor">
              {{ agent.roleLabel }}
            </span>
          </div>
          <div v-if="agent.responsibilities">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Verantwoordelijkheden</p>
            <ul class="space-y-1.5">
              <li v-for="(resp, i) in agent.responsibilities" :key="i" class="flex items-start gap-2 text-sm text-slate-600">
                <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                {{ resp }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-agent sections per C-level -->
    <div v-for="parent in clevel" :key="'section-' + parent.agentId" class="space-y-3">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Sub-agents — {{ parent.name }} ({{ parent.roleLabel }})
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="sub in subAgentsByParent[parent.roleLabel]"
          :key="sub.agentId"
          class="bg-white rounded-xl border border-slate-200 border-l-4 p-4 space-y-1"
          :class="PARENT_BORDER[parent.roleLabel]"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ sub.emoji }}</span>
            <p class="text-sm font-semibold text-slate-800">{{ sub.name }}</p>
          </div>
          <p class="text-xs text-slate-500">{{ sub.roleLabel }}</p>
          <p class="text-xs text-slate-400">{{ sub.triggeredBy }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
