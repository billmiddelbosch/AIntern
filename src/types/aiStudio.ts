export type AiStudioTemplateId =
  | 'vue-component'
  | 'pinia-store'
  | 'composable'
  | 'landing-section'
  | 'kennisbank-variant'
  | 'blank'

export interface AiStudioTemplate {
  id: AiStudioTemplateId
  label: string
  description: string
  defaultPrompt: string
  scaffoldCode: string
}

export interface AiStudioGenerateRequest {
  templateId: AiStudioTemplateId
  prompt: string
  existingCode?: string
}

export interface AiStudioGenerateResponse {
  code: string
  explanation?: string
}

export interface AiStudioSaveRequest {
  name: string
  templateId: AiStudioTemplateId
  prompt: string
  code: string
}

export interface AiStudioComponent {
  id: string
  name: string
  templateId: AiStudioTemplateId
  prompt: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface AiStudioGalleryResponse {
  items: AiStudioComponent[]
}

export interface AiStudioTemplateConfigResponse {
  templates: AiStudioTemplate[]
}
