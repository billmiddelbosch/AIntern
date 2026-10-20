<script setup lang="ts">
/**
 * [ATOM] Labelled text input or textarea with error styling.
 * 16px text on mobile so iOS does not zoom in on focus.
 */
withDefaults(
  defineProps<{
    id: string
    label: string
    type?: 'text' | 'email' | 'tel'
    required?: boolean
    invalid?: boolean
    maxlength?: number
    autocomplete?: string
    inputmode?: 'text' | 'email' | 'tel' | 'url'
    placeholder?: string
    /** Rows > 0 renders a textarea */
    rows?: number
  }>(),
  {
    type: 'text',
    required: false,
    invalid: false,
    maxlength: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    placeholder: undefined,
    rows: 0,
  },
)
const model = defineModel<string>({ required: true })

const baseClass =
  'min-h-11 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm'
const okClass = 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
const errorClass = 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium text-slate-700">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <textarea
      v-if="rows > 0"
      :id="id"
      v-model="model"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :required="required"
      :aria-invalid="invalid"
      :class="[baseClass, invalid ? errorClass : okClass]"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      :type="type"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :required="required"
      :aria-invalid="invalid"
      :class="[baseClass, invalid ? errorClass : okClass]"
    />
  </div>
</template>

