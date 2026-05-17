<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { QnAPair } from '@/types/kennisbank'

const props = defineProps<{
  faq: QnAPair[]
}>()

const emit = defineEmits<{
  'update:faq': [faq: QnAPair[]]
}>()

const { t } = useI18n()

const editingIndex = ref<number | null>(null)
const draftQuestion = ref('')
const draftAnswer = ref('')

function startAdd() {
  editingIndex.value = -1
  draftQuestion.value = ''
  draftAnswer.value = ''
}

function startEdit(index: number) {
  editingIndex.value = index
  draftQuestion.value = props.faq[index].question
  draftAnswer.value = props.faq[index].answer
}

function cancelEdit() {
  editingIndex.value = null
  draftQuestion.value = ''
  draftAnswer.value = ''
}

function saveEdit() {
  if (!draftQuestion.value.trim() || !draftAnswer.value.trim()) return
  const updated = [...props.faq]
  const pair: QnAPair = { question: draftQuestion.value.trim(), answer: draftAnswer.value.trim() }
  if (editingIndex.value === -1) {
    updated.push(pair)
  } else if (editingIndex.value !== null) {
    updated[editingIndex.value] = pair
  }
  emit('update:faq', updated)
  cancelEdit()
}

function removeItem(index: number) {
  const updated = props.faq.filter((_, i) => i !== index)
  emit('update:faq', updated)
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.faq]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:faq', updated)
}

function moveDown(index: number) {
  if (index === props.faq.length - 1) return
  const updated = [...props.faq]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:faq', updated)
}
</script>

<template>
  <div class="faq-panel">
    <div class="faq-panel__header">
      <span class="faq-panel__title">{{ t('admin.faqPanel.title') }}</span>
      <span class="faq-panel__count">{{ faq.length }}</span>
    </div>

    <!-- Existing items -->
    <div v-if="faq.length > 0" class="faq-panel__list">
      <div
        v-for="(item, index) in faq"
        :key="index"
        class="faq-item"
      >
        <div v-if="editingIndex === index" class="faq-item__form">
          <input
            v-model="draftQuestion"
            class="faq-input"
            :placeholder="t('admin.faqPanel.questionPlaceholder')"
          />
          <textarea
            v-model="draftAnswer"
            class="faq-textarea"
            rows="3"
            :placeholder="t('admin.faqPanel.answerPlaceholder')"
          />
          <div class="faq-item__actions">
            <button class="faq-btn faq-btn--save" @click="saveEdit">{{ t('admin.faqPanel.save') }}</button>
            <button class="faq-btn faq-btn--cancel" @click="cancelEdit">{{ t('admin.faqPanel.cancel') }}</button>
          </div>
        </div>
        <div v-else class="faq-item__view">
          <div class="faq-item__content">
            <p class="faq-item__question">{{ item.question }}</p>
            <p class="faq-item__answer">{{ item.answer }}</p>
          </div>
          <div class="faq-item__controls">
            <button class="faq-icon-btn" :title="t('admin.faqPanel.moveUp')" :disabled="index === 0" @click="moveUp(index)">↑</button>
            <button class="faq-icon-btn" :title="t('admin.faqPanel.moveDown')" :disabled="index === faq.length - 1" @click="moveDown(index)">↓</button>
            <button class="faq-icon-btn faq-icon-btn--edit" :title="t('admin.faqPanel.edit')" @click="startEdit(index)">✎</button>
            <button class="faq-icon-btn faq-icon-btn--delete" :title="t('admin.faqPanel.delete')" @click="removeItem(index)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <p v-else class="faq-panel__empty">{{ t('admin.faqPanel.empty') }}</p>

    <!-- Add form -->
    <div v-if="editingIndex === -1" class="faq-item__form faq-item__form--add">
      <input
        v-model="draftQuestion"
        class="faq-input"
        :placeholder="t('admin.faqPanel.questionPlaceholder')"
        autofocus
      />
      <textarea
        v-model="draftAnswer"
        class="faq-textarea"
        rows="3"
        :placeholder="t('admin.faqPanel.answerPlaceholder')"
      />
      <div class="faq-item__actions">
        <button class="faq-btn faq-btn--save" @click="saveEdit">{{ t('admin.faqPanel.add') }}</button>
        <button class="faq-btn faq-btn--cancel" @click="cancelEdit">{{ t('admin.faqPanel.cancel') }}</button>
      </div>
    </div>

    <!-- Add button -->
    <button v-else class="faq-panel__add-btn" @click="startAdd">
      + {{ t('admin.faqPanel.addButton') }}
    </button>
  </div>
</template>

<style scoped>
.faq-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.faq-panel__title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.faq-panel__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.7rem;
  font-weight: 600;
}

.faq-panel__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.faq-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.faq-item__view {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
}

.faq-item__content {
  flex: 1;
  min-width: 0;
}

.faq-item__question {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.faq-item__answer {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.faq-item__controls {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.faq-icon-btn {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: #94a3b8;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.faq-icon-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #475569;
}

.faq-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.faq-icon-btn--edit:hover:not(:disabled) {
  background: #ede9fe;
  color: #6d28d9;
}

.faq-icon-btn--delete:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.faq-item__form {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
}

.faq-item__form--add {
  border: 1.5px dashed #c7d2fe;
  border-radius: 0.75rem;
  background: #f5f3ff;
}

.faq-input {
  width: 100%;
  padding: 0.4375rem 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: white;
  color: #1e293b;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.faq-input:focus {
  border-color: #6366f1;
}

.faq-textarea {
  width: 100%;
  padding: 0.4375rem 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: white;
  color: #1e293b;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s;
}

.faq-textarea:focus {
  border-color: #6366f1;
}

.faq-item__actions {
  display: flex;
  gap: 0.5rem;
}

.faq-btn {
  padding: 0.375rem 0.875rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s;
}

.faq-btn--save {
  background: #6366f1;
  color: white;
}

.faq-btn--save:hover {
  background: #4f46e5;
}

.faq-btn--cancel {
  background: #f1f5f9;
  color: #475569;
}

.faq-btn--cancel:hover {
  background: #e2e8f0;
}

.faq-panel__empty {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

.faq-panel__add-btn {
  align-self: flex-start;
  padding: 0.375rem 0.875rem;
  border: 1.5px dashed #c7d2fe;
  border-radius: 0.5rem;
  background: transparent;
  color: #6366f1;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.faq-panel__add-btn:hover {
  background: #eef2ff;
  border-color: #6366f1;
}
</style>
