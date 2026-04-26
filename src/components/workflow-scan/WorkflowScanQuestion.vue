<script setup lang="ts">
import { ref, watch } from 'vue'

interface Question {
  id: string
  type: 'slider' | 'choice' | 'dropdown'
  label: string
  min?: number
  max?: number
  unit?: string
  options?: readonly string[]
}

const props = defineProps<{ question: Question; modelValue: string | number | undefined }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const sliderValue = ref<number>(
  props.question.type === 'slider' ? (props.modelValue as number | undefined) ?? props.question.min ?? 0 : 0,
)

watch(sliderValue, (v) => emit('update:modelValue', v))
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-slate-800">{{ question.label }}</h2>

    <!-- Slider -->
    <div v-if="question.type === 'slider'" class="space-y-3">
      <div class="text-3xl font-bold text-indigo-600 text-center">
        {{ sliderValue }} {{ question.unit }}
      </div>
      <input
        v-model.number="sliderValue"
        type="range"
        :min="question.min"
        :max="question.max"
        class="w-full accent-indigo-600"
      />
      <div class="flex justify-between text-xs text-slate-400">
        <span>{{ question.min }} {{ question.unit }}</span>
        <span>{{ question.max }} {{ question.unit }}</span>
      </div>
    </div>

    <!-- 3-choice buttons -->
    <div v-else-if="question.type === 'choice'" class="grid gap-3">
      <button
        v-for="option in question.options"
        :key="option"
        class="w-full py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-colors"
        :class="
          modelValue === option
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
        "
        @click="$emit('update:modelValue', option)"
      >
        {{ option }}
      </button>
    </div>

    <!-- Dropdown -->
    <div v-else-if="question.type === 'dropdown'">
      <select
        :value="modelValue"
        class="w-full py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm focus:border-indigo-500 focus:outline-none"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled selected>Kies jouw sector...</option>
        <option v-for="option in question.options" :key="option" :value="option">{{ option }}</option>
      </select>
    </div>
  </div>
</template>
