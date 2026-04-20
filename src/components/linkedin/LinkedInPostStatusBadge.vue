<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LinkedInPostStatus } from '@/types/linkedinPost'

const props = defineProps<{ status: LinkedInPostStatus }>()
const { t } = useI18n()

const colorMap: Record<LinkedInPostStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  approved: 'bg-blue-50 text-blue-700 ring-blue-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-red-50 text-red-500 ring-red-200',
}

const classes = computed(() => colorMap[props.status])
const label = computed(() => t(`linkedinPosts.status.${props.status}`))
</script>

<template>
  <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ring-1" :class="classes">
    {{ label }}
  </span>
</template>
