/**
 * AI Studio — TypeScript types
 *
 * These types are used by the Vue components in the AI Studio feature.
 * They extend / align with the types defined in src/types/aiStudio.ts,
 * which is the authoritative runtime type file.
 *
 * This file exists for design-stage documentation and cross-component
 * prop contract reference. Import src/types/aiStudio.ts in production code.
 */

// =============================================================================
// Core Domain Types  (aligned with global data model + src/types/aiStudio.ts)
// =============================================================================

export type AiStudioItemType = 'component' | 'template'

export type AiGenerationStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * A saved AI-generated Vue SFC file, persisted in DynamoDB.
 * Aligns with the AiGeneratedItem entity in the global data model.
 */
export interface AiGeneratedItem {
  /** UUID (part of DynamoDB SK) */
  id: string
  /** Distinguishes component gallery from template gallery */
  type: AiStudioItemType
  /** PascalCase filename without extension, e.g. "PricingCard" */
  name: string
  /** The original natural language prompt used to generate the file */
  instruction: string
  /** Full .vue SFC source code — stored for the "Load" feature */
  code: string
  /** Repository file path, e.g. "src/components/ai-generated/PricingCard.vue" */
  filePath: string
  /** GitHub commit SHA returned by the GitHub Contents API */
  githubCommitSha: string
  /** ISO-8601 creation timestamp */
  createdAt: string
  /** Admin user ID extracted from the JWT token */
  createdBy: string
}

/**
 * The DynamoDB config record that controls which kennisbank template is active.
 * One record per environment — no deploy required to switch.
 */
export interface AiTemplateConfig {
  /** PascalCase Vue component name, e.g. "KennisbankArtikelViewMinimal" */
  activeTemplateName: string
  /** ISO-8601 timestamp of last update */
  updatedAt: string
}

/**
 * Mock article data injected into the iframe preview when type === 'template'.
 * Represents the props a real kennisbank article page would receive.
 */
export interface MockArticleData {
  title: string
  /** HTML string — rendered via v-html in the template */
  body: string
  /** ISO date string, e.g. "2026-05-07" */
  publishedAt: string
  readingTimeMinutes: number
  category: string
}

// =============================================================================
// API Request / Response Types
// =============================================================================

export interface AiGenerateRequest {
  type: AiStudioItemType
  instruction: string
}

export interface AiGenerateResponse {
  code: string
}

export interface AiSaveRequest {
  type: AiStudioItemType
  /** PascalCase, validated by Lambda regex /^[A-Z][a-zA-Z0-9]+$/ */
  name: string
  instruction: string
  code: string
}

export interface AiSaveResponse {
  id: string
  filePath: string
  githubCommitSha: string
  createdAt: string
}

export interface AiGalleryResponse {
  items: AiGeneratedItem[]
}

// =============================================================================
// Component Props Interfaces
// =============================================================================

/**
 * Props for AiStudioHeader.vue [MOLECULE]
 * Renders the page title and two tab switch buttons.
 */
export interface AiStudioHeaderProps {
  activeTab: AiStudioItemType
}

/**
 * Props for ComponentBuilder.vue / TemplateBuilder.vue [ORGANISM]
 * Each builder organism is self-contained via the useAiStudio composable.
 */
export interface BuilderProps {
  type: AiStudioItemType
}

/**
 * Props for AiPromptPanel.vue [MOLECULE]
 * Labelled textarea + generate button with character count.
 */
export interface AiPromptPanelProps {
  modelValue: string
  /** Disables the generate button and shows loading state */
  loading: boolean
}

/**
 * Props for AiCodeEditor.vue [MOLECULE]
 * Plain textarea with monospace font.
 * Edits trigger re-compile in the parent organism via watcher.
 */
export interface AiCodeEditorProps {
  modelValue: string
  language: 'vue'
}

/**
 * Props for AiPreviewPane.vue [ORGANISM]
 * Iframe sandbox — compiles and renders the Vue SFC code client-side.
 */
export interface AiPreviewPaneProps {
  code: string
  /**
   * Only provided when type === 'template'. Injected into the iframe
   * as the component's props so the preview renders realistic content.
   */
  mockData?: MockArticleData
}

/**
 * Props for AiSavePanel.vue [MOLECULE]
 * Name input, save button, optional "Set as active" toggle for templates.
 */
export interface AiSavePanelProps {
  type: AiStudioItemType
  saving: boolean
  /** The last successfully saved component name, shown as confirmation */
  savedName?: string
  /** Whether this template is currently the active kennisbank template */
  isActive?: boolean
}

/**
 * Props for AiGalleryPanel.vue [ORGANISM]
 * Collapsible list of saved gallery cards.
 */
export interface AiGalleryPanelProps {
  items: AiGeneratedItem[]
  loading: boolean
}

/**
 * Props for AiGalleryCard.vue [MOLECULE]
 * Single card inside the gallery list.
 */
export interface AiGalleryCardProps {
  item: AiGeneratedItem
  /** Marks this card as the currently active kennisbank template */
  isActive?: boolean
}

/**
 * Props for AiGenerationStatus.vue [ATOM]
 * Inline status indicator: spinner / checkmark / error badge.
 */
export interface AiGenerationStatusProps {
  status: AiGenerationStatus
  message?: string
}

// =============================================================================
// Component Emits Interfaces
// =============================================================================

/**
 * Emits for AiStudioHeader.vue
 *
 * Usage:
 * ```vue
 * const emit = defineEmits<AiStudioHeaderEmits>()
 * emit('update:activeTab', 'template')
 * ```
 */
export interface AiStudioHeaderEmits {
  (e: 'update:activeTab', tab: AiStudioItemType): void
}

/**
 * Emits for AiPromptPanel.vue
 */
export interface AiPromptPanelEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'generate'): void
}

/**
 * Emits for AiCodeEditor.vue
 */
export interface AiCodeEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/**
 * Emits for AiSavePanel.vue
 */
export interface AiSavePanelEmits {
  (e: 'save', name: string): void
  (e: 'setActive'): void
}

/**
 * Emits for AiGalleryPanel.vue
 */
export interface AiGalleryPanelEmits {
  (e: 'load', item: AiGeneratedItem): void
  (e: 'delete', id: string): void
}

/**
 * Emits for AiGalleryCard.vue
 */
export interface AiGalleryCardEmits {
  (e: 'load', item: AiGeneratedItem): void
  (e: 'delete', id: string): void
}

// =============================================================================
// Composable Return Type
// =============================================================================

/**
 * Return type of useAiStudio(type: AiStudioItemType)
 * This composable is instantiated once per builder organism.
 */
export interface UseAiStudioReturn {
  // State
  prompt: { value: string }
  generatedCode: { value: string }
  status: { value: AiGenerationStatus }
  errorMessage: { value: string | null }
  saveName: { value: string }
  saving: { value: boolean }
  gallery: { value: AiGeneratedItem[] }
  galleryLoading: { value: boolean }
  /** Only populated when type === 'template' */
  activeTemplateName: { value: string | null }

  // Actions
  generate(): Promise<void>
  save(): Promise<void>
  setActiveTemplate(name: string): Promise<void>
  fetchGallery(): Promise<void>
  deleteGalleryItem(id: string): Promise<void>
  loadGalleryItem(item: AiGeneratedItem): void
}
