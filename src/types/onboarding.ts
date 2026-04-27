export type ChecklistItemId =
  | 'intro_call'
  | 'access_setup'
  | 'nda_signed'
  | 'process_mapping'
  | 'data_sample'
  | 'first_automation'
  | 'client_feedback'
  | 'go_live'
  | 'training'
  | 'sign_off'

export interface ChecklistItem {
  id: ChecklistItemId
  label: string
  done: boolean
  completedAt: string | null
}

export interface OnboardingEntry {
  clientId: string
  clientName: string
  createdAt: string
  createdBy: string
  status: 'active' | 'completed'
  items: ChecklistItem[]
}
