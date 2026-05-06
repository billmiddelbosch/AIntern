<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  content: string
  knownSlugs: string[]
}>()

const emit = defineEmits<{
  'update-link': [oldHref: string, newHref: string]
  'remove-link': [href: string, anchorText: string]
}>()

const { t } = useI18n()

interface ParsedLink {
  anchorText: string
  href: string
  isBroken: boolean
}

const links = computed<ParsedLink[]>(() => {
  return Array.from(props.content.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)).map(
    ([, href, rawText]) => {
      const anchorText = rawText.replace(/<[^>]+>/g, '')
      const isBroken =
        href.startsWith('/kennisbank/') &&
        !props.knownSlugs.includes(href.slice('/kennisbank/'.length))
      return { anchorText, href, isBroken }
    },
  )
})

const brokenCount = computed(() => links.value.filter((l) => l.isBroken).length)

const editingHref = ref<string | null>(null)
const editValue = ref('')

function startEdit(href: string) {
  editingHref.value = href
  editValue.value = href
}

function saveEdit(link: ParsedLink) {
  const newHref = editValue.value.trim()
  if (newHref && newHref !== link.href) {
    emit('update-link', link.href, newHref)
  }
  editingHref.value = null
}

function cancelEdit() {
  editingHref.value = null
}

function removeLink(link: ParsedLink) {
  emit('remove-link', link.href, link.anchorText)
}
</script>

<template>
  <div
    class="rounded-xl border p-4 space-y-3"
    :class="brokenCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'"
  >
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {{ t('admin.articleForm.links.heading') }}
        <span v-if="links.length > 0" class="ml-1 font-normal normal-case text-slate-400"
          >({{ links.length }})</span
        >
      </p>
      <span v-if="brokenCount > 0" class="text-xs font-semibold text-red-500">
        ⚠ {{ brokenCount }} {{ t('admin.articleForm.links.brokenCount') }}
      </span>
    </div>

    <p v-if="links.length === 0" class="text-xs text-slate-400">
      {{ t('admin.articleForm.links.empty') }}
    </p>

    <div v-else class="space-y-2">
      <div
        v-for="(link, i) in links"
        :key="i"
        class="rounded-lg border p-2.5 text-xs"
        :class="link.isBroken ? 'border-red-200 bg-white' : 'border-slate-200 bg-white'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="font-medium text-slate-700 truncate">{{ link.anchorText }}</div>
            <div
              v-if="editingHref !== link.href"
              class="font-mono mt-0.5 truncate"
              :class="link.isBroken ? 'text-red-400' : 'text-slate-400'"
            >
              {{ link.href }}
            </div>
            <div v-if="link.isBroken && editingHref !== link.href" class="text-red-500 mt-0.5">
              {{ t('admin.articleForm.links.broken') }}
            </div>
          </div>
          <div v-if="editingHref !== link.href" class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              @click="startEdit(link.href)"
            >
              {{ t('admin.articleForm.links.edit') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              @click="removeLink(link)"
            >
              ✕
            </button>
          </div>
        </div>

        <div v-if="editingHref === link.href" class="flex gap-1.5 mt-2">
          <input
            v-model="editValue"
            type="text"
            class="flex-1 rounded border border-slate-200 px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
            @keydown.enter="saveEdit(link)"
            @keydown.escape="cancelEdit"
          />
          <button
            type="button"
            class="px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            @click="saveEdit(link)"
          >
            {{ t('admin.articleForm.links.save') }}
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            @click="cancelEdit"
          >
            {{ t('admin.articleForm.links.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
