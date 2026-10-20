<script setup lang="ts">
/**
 * [MOLECULE] Save / discard bar. On a phone it sticks to the bottom of the
 * screen so the buttons stay in reach while scrolling the blocks.
 */
import { useI18n } from 'vue-i18n'

defineProps<{ pendingCount: number; saving: boolean; saved: boolean }>()
defineEmits<{ save: []; discard: [] }>()
const { t } = useI18n()
</script>

<template>
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-b-xl border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur md:justify-end"
    data-testid="save-bar"
  >
    <span v-if="pendingCount > 0" class="w-full text-xs text-amber-700 md:w-auto" role="status">
      {{ t('admin.bookings.pendingCount', { count: pendingCount }) }}
    </span>
    <span v-else-if="saved" class="w-full text-xs text-emerald-700 md:w-auto" role="status">
      {{ t('admin.bookings.saved') }}
    </span>
    <button
      type="button"
      class="min-h-11 flex-1 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 md:min-h-9 md:flex-none md:text-xs"
      :disabled="pendingCount === 0 || saving"
      @click="$emit('discard')"
    >
      {{ t('admin.bookings.discard') }}
    </button>
    <button
      type="button"
      class="min-h-11 flex-1 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 md:min-h-9 md:flex-none md:text-xs"
      :disabled="pendingCount === 0 || saving"
      @click="$emit('save')"
    >
      {{ saving ? t('admin.bookings.saving') : t('admin.bookings.save') }}
    </button>
  </div>
</template>
