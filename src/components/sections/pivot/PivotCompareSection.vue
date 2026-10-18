<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const columns = ['saas', 'agency', 'nocode', 'aintern'] as const
  const rows = ['ownership', 'exit', 'speed', 'fit', 'cost', 'europe'] as const
</script>

<template>
  <section class="bg-white py-20 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
      <SectionIntro
        :eyebrow="t('pivot.home.compare.eyebrow')"
        :heading="t('pivot.home.compare.heading')"
      />
      <div class="overflow-x-auto rounded-2xl border border-slate-200">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="bg-slate-50">
              <th scope="col" class="px-5 py-4">
                <span class="sr-only">{{ t('pivot.home.compare.eyebrow') }}</span>
              </th>
              <th
                v-for="col in columns"
                :key="col"
                scope="col"
                class="px-5 py-4 font-heading font-semibold"
                :class="col === 'aintern' ? 'bg-indigo-600 text-white' : 'text-slate-700'"
              >
                {{ t(`pivot.home.compare.columns.${col}`) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row" class="border-t border-slate-100">
              <th scope="row" class="px-5 py-4 font-medium text-slate-900">
                {{ t(`pivot.home.compare.rows.${row}.label`) }}
              </th>
              <td
                v-for="col in columns"
                :key="col"
                class="px-5 py-4"
                :class="
                  col === 'aintern'
                    ? 'bg-indigo-50 font-semibold text-indigo-700'
                    : 'text-slate-500'
                "
              >
                {{ t(`pivot.home.compare.rows.${row}.${col}`) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
