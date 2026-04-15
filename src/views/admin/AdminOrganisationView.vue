<script setup lang="ts">
interface Agent {
  name: string
  role: string
  roleColor: string
  responsibilities: string[]
  reportsTo: string | null
}

const agents: Agent[] = [
  {
    name: 'Alex',
    role: 'CEO',
    roleColor: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    responsibilities: [
      'Eindverantwoordelijkheid voor strategie en richting van AIntern',
      'Sales, klantrelaties en zakelijke partnerships',
      'Bewaking van de Q2 OKRs en rapportage aan het board',
    ],
    reportsTo: null,
  },
  {
    name: 'Blake',
    role: 'CMO',
    roleColor: 'bg-pink-50 text-pink-700 ring-pink-200',
    responsibilities: [
      'Contentmarketing, LinkedIn-presence en lead-generatie',
      'Kennisbank publicaties en campagnestrategie',
      'Merkpositionering en doelgroepbereik voor het MKB',
    ],
    reportsTo: 'Alex (CEO)',
  },
  {
    name: 'Morgan',
    role: 'CTO',
    roleColor: 'bg-teal-50 text-teal-700 ring-teal-200',
    responsibilities: [
      'Technische architectuur van het platform en Lambda-functies',
      'Infrastructuur (AWS CDK), CI/CD en security',
      'Technische roadmap en sprint-planning',
    ],
    reportsTo: 'Alex (CEO)',
  },
  {
    name: 'Sam',
    role: 'COO',
    roleColor: 'bg-violet-50 text-violet-700 ring-violet-200',
    responsibilities: [
      'Operationele processen, kwaliteitsbewaking en SLA-naleving',
      'Klant-onboarding en projectdelivery',
      'Interne efficiëntie en tooling',
    ],
    reportsTo: 'Alex (CEO)',
  },
]

const ceo = agents.find((a) => a.reportsTo === null)!
const reports = agents.filter((a) => a.reportsTo !== null)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <!-- Page header -->
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">Organisatie</h2>
      <p class="mt-1 text-sm text-slate-500">
        Overzicht van het AIntern C-suite agentteam — rollen, verantwoordelijkheden en hiërarchie.
      </p>
    </div>

    <!-- Hierarchy diagram -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">
        Organisatiehiërarchie
      </h3>

      <!-- CEO -->
      <div class="flex flex-col items-center">
        <div class="flex flex-col items-center w-44">
          <div
            class="w-full text-center rounded-xl border border-slate-200 bg-indigo-50 px-4 py-3 shadow-sm"
          >
            <p class="text-sm font-bold text-indigo-800">{{ ceo.name }}</p>
            <span
              class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
              :class="ceo.roleColor"
            >{{ ceo.role }}</span>
          </div>
        </div>

        <!-- Connector line -->
        <div class="w-px h-6 bg-slate-200" />

        <!-- Horizontal bar -->
        <div class="relative flex items-start justify-center w-full max-w-2xl">
          <!-- Horizontal line spanning all reports -->
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-slate-200" />

          <!-- Report cards -->
          <div class="grid grid-cols-3 gap-4 w-full pt-0">
            <div
              v-for="agent in reports"
              :key="agent.role"
              class="flex flex-col items-center"
            >
              <!-- Vertical drop from horizontal bar -->
              <div class="w-px h-6 bg-slate-200" />
              <div
                class="w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <p class="text-sm font-bold text-slate-800">{{ agent.name }}</p>
                <span
                  class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
                  :class="agent.roleColor"
                >{{ agent.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="agent in agents"
        :key="agent.role"
        class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <!-- Card header -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-base font-semibold text-slate-800">{{ agent.name }}</p>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ agent.reportsTo ? `Rapporteert aan: ${agent.reportsTo}` : 'Eindverantwoordelijke' }}
            </p>
          </div>
          <span
            class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ring-1"
            :class="agent.roleColor"
          >{{ agent.role }}</span>
        </div>

        <!-- Responsibilities -->
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Verantwoordelijkheden
          </p>
          <ul class="space-y-1.5">
            <li
              v-for="(resp, index) in agent.responsibilities"
              :key="index"
              class="flex items-start gap-2 text-sm text-slate-600"
            >
              <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              {{ resp }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
