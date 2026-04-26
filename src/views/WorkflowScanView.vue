<script setup lang="ts">
import { ref, computed } from 'vue'
import WorkflowScanWelcome from '@/components/workflow-scan/WorkflowScanWelcome.vue'
import WorkflowScanQuestion from '@/components/workflow-scan/WorkflowScanQuestion.vue'
import WorkflowScanProgress from '@/components/workflow-scan/WorkflowScanProgress.vue'
import WorkflowScanPartialResult from '@/components/workflow-scan/WorkflowScanPartialResult.vue'
import WorkflowScanEmailGate from '@/components/workflow-scan/WorkflowScanEmailGate.vue'
import WorkflowScanFullReport from '@/components/workflow-scan/WorkflowScanFullReport.vue'
import { useWorkflowScan } from '@/composables/useWorkflowScan'

const { QUESTIONS, answers, score, topIssues, recommendations, submitting, calculateScore, submitScan } = useWorkflowScan()

type Stage = 'welcome' | 'questions' | 'partial-result' | 'email-gate' | 'full-report'
const stage = ref<Stage>('welcome')
const questionIndex = ref(0)

const currentQuestion = computed(() => QUESTIONS[questionIndex.value])

function startScan() {
  stage.value = 'questions'
}

function nextQuestion() {
  calculateScore()
  if (questionIndex.value < QUESTIONS.length - 1) {
    questionIndex.value++
  } else {
    stage.value = 'partial-result'
  }
}

function prevQuestion() {
  if (questionIndex.value > 0) questionIndex.value--
  else stage.value = 'welcome'
}

function requestReport() {
  stage.value = 'email-gate'
}

async function handleEmailSubmit(email: string) {
  await submitScan(email)
  stage.value = 'full-report'
}

const canAdvance = computed(() => {
  const q = currentQuestion.value
  const val = answers.value[q.id]
  if (q.type === 'slider') return val !== undefined
  return val !== undefined && val !== ''
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-4">
    <div class="max-w-xl mx-auto">
      <!-- Welcome -->
      <WorkflowScanWelcome v-if="stage === 'welcome'" @start="startScan" />

      <!-- Questions -->
      <div v-else-if="stage === 'questions'" class="space-y-8">
        <WorkflowScanProgress :current="questionIndex + 1" :total="QUESTIONS.length" />

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <WorkflowScanQuestion
            :key="currentQuestion.id"
            :question="currentQuestion"
            :model-value="answers[currentQuestion.id]"
            @update:model-value="(v) => (answers[currentQuestion.id] = v)"
          />
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            @click="prevQuestion"
          >
            ← Terug
          </button>
          <button
            :disabled="!canAdvance"
            class="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
            @click="nextQuestion"
          >
            {{ questionIndex === QUESTIONS.length - 1 ? 'Bekijk resultaat →' : 'Volgende →' }}
          </button>
        </div>
      </div>

      <!-- Partial result -->
      <div v-else-if="stage === 'partial-result'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <WorkflowScanPartialResult
          :score="score"
          :top-issues="topIssues"
          @request-report="requestReport"
        />
      </div>

      <!-- Email gate -->
      <div v-else-if="stage === 'email-gate'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <WorkflowScanEmailGate :loading="submitting" @submit="handleEmailSubmit" />
      </div>

      <!-- Full report -->
      <div v-else-if="stage === 'full-report'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <WorkflowScanFullReport
          :score="score"
          :top-issues="topIssues"
          :recommendations="recommendations"
        />
      </div>
    </div>
  </div>
</template>
