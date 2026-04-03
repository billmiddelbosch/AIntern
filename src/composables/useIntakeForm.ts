import axios from '@/lib/axios'

export interface IntakeAnswers {
  email: string
  companySize: string
  processDescription: string
  processDuration: string
  triedBefore: string
  impact: string
}

export async function submitIntakeAnswers(answers: IntakeAnswers): Promise<void> {
  const endpoint = import.meta.env.VITE_INTAKE_ENDPOINT
  if (!endpoint) return

  await axios.post(
    endpoint,
    {
      email: answers.email,
      companySize: answers.companySize,
      processDescription: answers.processDescription,
      processDuration: answers.processDuration,
      triedBefore: answers.triedBefore,
      impact: answers.impact,
    },
    { headers: { 'Content-Type': 'application/json' } },
  )
}
