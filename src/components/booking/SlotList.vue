<script setup lang="ts">
/** [MOLECULE] Grid of time SlotButtons: 3 per row on a phone, 4 from sm. */
import SlotButton from '@/components/ui/SlotButton.vue'

defineProps<{ slots: { value: string; label: string }[]; label: string }>()
const selected = defineModel<string | null>({ required: true })
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" :aria-label="label">
    <SlotButton
      v-for="slot in slots"
      :key="slot.value"
      role="option"
      :aria-selected="slot.value === selected"
      :selected="slot.value === selected"
      @click="selected = slot.value"
    >
      {{ slot.label }}
    </SlotButton>
  </div>
</template>
