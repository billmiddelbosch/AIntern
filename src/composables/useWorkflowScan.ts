import { ref } from 'vue'
import axios from '@/lib/axios'
import type { ScanRecommendation } from '@/types/workflowScan'

export const QUESTIONS = [
  {
    id: 'q1',
    type: 'slider' as const,
    label: 'Hoeveel uur per week besteedt je team aan repetitieve taken?',
    min: 0,
    max: 20,
    unit: 'uur',
    score: (v: number) => v,
  },
  {
    id: 'q2',
    type: 'choice' as const,
    label: 'Werken jullie systemen automatisch samen (bijv. ERP ↔ webshop)?',
    options: ['Ja', 'Deels', 'Nee'],
    score: (v: string) => ({ Ja: 0, Deels: 10, Nee: 20 }[v] ?? 0),
  },
  {
    id: 'q3',
    type: 'choice' as const,
    label: 'Worden klantgegevens op meerdere plekken handmatig ingevoerd?',
    options: ['Ja', 'Nee'],
    score: (v: string) => (v === 'Ja' ? 15 : 0),
  },
  {
    id: 'q4',
    type: 'choice' as const,
    label: 'Hoe vaak ontstaan fouten door menselijke invoer?',
    options: ['Zelden', 'Soms', 'Regelmatig'],
    score: (v: string) => ({ Zelden: 0, Soms: 10, Regelmatig: 20 }[v] ?? 0),
  },
  {
    id: 'q5',
    type: 'choice' as const,
    label: 'Beschikt je team over AI-tools in de dagelijkse workflow?',
    options: ['Ja', 'Paar', 'Nee'],
    score: (v: string) => ({ Ja: 0, Paar: 10, Nee: 20 }[v] ?? 0),
  },
  {
    id: 'q6',
    type: 'choice' as const,
    label: 'Hoe lang duurt een standaard offerte of rapport?',
    options: ['< 30 min', '30–90 min', '90+ min'],
    score: (v: string) => ({ '< 30 min': 0, '30–90 min': 10, '90+ min': 20 }[v] ?? 0),
  },
  {
    id: 'q7',
    type: 'dropdown' as const,
    label: 'In welke sector werkt je bedrijf?',
    options: ['Webshop', 'Productie', 'Zakelijke dienstverlening', 'Horeca', 'Zorg', 'Retail', 'Anders'],
    score: () => 0,
  },
] as const

const ISSUE_MAP: Record<string, { threshold: (v: unknown) => boolean; label: string }[]> = {
  q1: [{ threshold: (v) => (v as number) >= 10, label: 'Hoge tijdsbesteding aan repetitief werk' }],
  q2: [{ threshold: (v) => v === 'Nee', label: 'Systemen werken niet samen — handmatige overdracht' }],
  q3: [{ threshold: (v) => v === 'Ja', label: 'Dubbele data-invoer verhoogt foutkans' }],
  q4: [{ threshold: (v) => v === 'Regelmatig', label: 'Structurele invoerfouten door menselijke factor' }],
  q5: [{ threshold: (v) => v === 'Nee', label: 'Geen AI-ondersteuning in huidige werkprocessen' }],
  q6: [{ threshold: (v) => v === '90+ min', label: 'Traag offerteproces — verlies van verkoopkansen' }],
}

const MAX_RAW_SCORE = 115

export function useWorkflowScan() {
  const answers = ref<Record<string, string | number>>({})
  const score = ref(0)
  const rawScore = ref(0)
  const topIssues = ref<string[]>([])
  const recommendations = ref<ScanRecommendation[]>([])
  const submitting = ref(false)
  const submissionId = ref<string | null>(null)

  function calculateScore() {
    let raw = 0
    for (const q of QUESTIONS) {
      const answer = answers.value[q.id]
      if (answer !== undefined) {
        if (q.type === 'slider') {
          raw += (q.score as (v: number) => number)(answer as number)
        } else if (q.type !== 'dropdown') {
          raw += (q.score as (v: string) => number)(answer as string)
        }
      }
    }
    rawScore.value = raw
    score.value = Math.round((1 - raw / MAX_RAW_SCORE) * 100)

    const issues: string[] = []
    for (const [qId, rules] of Object.entries(ISSUE_MAP)) {
      const answer = answers.value[qId]
      for (const rule of rules) {
        if (answer !== undefined && rule.threshold(answer)) {
          issues.push(rule.label)
        }
      }
    }
    topIssues.value = issues.slice(0, 3)
  }

  async function submitScan(email: string): Promise<void> {
    submitting.value = true
    try {
      const { data } = await axios.post<{ id: string; recommendations: ScanRecommendation[] }>(
        '/workflow-scan',
        {
          email,
          answers: answers.value,
          score: score.value,
          rawScore: rawScore.value,
          topIssues: topIssues.value,
        },
      )
      submissionId.value = data.id
      recommendations.value = data.recommendations
    } finally {
      submitting.value = false
    }
  }

  function getScoreLabel(): { label: string; color: string } {
    const s = score.value
    if (s >= 70) return { label: 'Relatief geoptimaliseerd', color: 'green' }
    if (s >= 40) return { label: 'Geïdentificeerde gaps', color: 'orange' }
    return { label: 'Hoog automatiserings-potentieel', color: 'red' }
  }

  return {
    answers,
    score,
    rawScore,
    topIssues,
    recommendations,
    submitting,
    submissionId,
    calculateScore,
    submitScan,
    getScoreLabel,
    QUESTIONS,
  }
}
