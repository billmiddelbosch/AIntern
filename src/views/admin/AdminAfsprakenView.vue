<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminBookings } from '@/composables/useAdminBookings'
import { BOOKING_TIMEZONE, amsterdamParts, buildWeeks, cellKey } from '@/utils/bookingGrid'
import type { AdminBooking, AdminBookingsResponse } from '@/types/booking'

const { t, locale } = useI18n()
const router = useRouter()
const { fetchBookings, updateAvailability } = useAdminBookings()

const data = ref<AdminBookingsResponse | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const savedMessage = ref(false)

/** Blocks that are open in the database */
const savedOpen = ref<Set<string>>(new Set())
/** Blocks that are open in the editor (incl. unsaved changes) */
const draftOpen = ref<Set<string>>(new Set())
const weekIndex = ref(0)

function applyResponse(response: AdminBookingsResponse): void {
  data.value = response
  savedOpen.value = new Set(response.open)
  draftOpen.value = new Set(response.open)
  weekIndex.value = Math.min(weekIndex.value, Math.max(buildWeeks(response.grid).length - 1, 0))
}

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    applyResponse(await fetchBookings())
  } catch {
    error.value = t('admin.bookings.loadError')
  } finally {
    loading.value = false
  }
}

// ── Appointments list ───────────────────────────────────────────────────────

const now = ref(Date.now())
const upcoming = computed(() =>
  (data.value?.bookings ?? []).filter((b) => Date.parse(b.end) >= now.value),
)
const past = computed(() =>
  (data.value?.bookings ?? []).filter((b) => Date.parse(b.end) < now.value).reverse(),
)

const dateLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))

function formatBookingTime(b: AdminBooking): string {
  const day = new Intl.DateTimeFormat(dateLocale.value, {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(b.start))
  return `${day} · ${amsterdamParts(b.start).time}–${amsterdamParts(b.end).time}`
}

function openLead(b: AdminBooking): void {
  if (!b.leadWebsite) return
  router.push({ name: 'admin-lead-detail', params: { id: encodeURIComponent(b.leadWebsite) } })
}

// ── Availability grid ───────────────────────────────────────────────────────

const weeks = computed(() => buildWeeks(data.value?.grid ?? []))
const week = computed(() => weeks.value[weekIndex.value] ?? null)

const bookedByStart = computed(() => {
  const map = new Map<string, AdminBooking>()
  for (const b of data.value?.bookings ?? []) map.set(b.start, b)
  return map
})

function formatDay(date: string): string {
  return new Intl.DateTimeFormat(dateLocale.value, {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00Z`))
}

function cellIso(date: string, time: string): string | undefined {
  return week.value?.cells[cellKey(date, time)]
}

/** Blocks that can be toggled (in the grid and not booked) */
function editable(isos: (string | undefined)[]): string[] {
  return isos.filter((iso): iso is string => !!iso && !bookedByStart.value.has(iso))
}

function dayIsos(date: string): string[] {
  return editable((week.value?.times ?? []).map((time) => cellIso(date, time)))
}

const weekIsos = computed(() => (week.value ? week.value.days.flatMap(dayIsos) : []))

function allOpen(isos: string[]): boolean {
  return isos.length > 0 && isos.every((iso) => draftOpen.value.has(iso))
}

function setOpen(isos: string[], open: boolean): void {
  const next = new Set(draftOpen.value)
  for (const iso of isos) {
    if (open) next.add(iso)
    else next.delete(iso)
  }
  draftOpen.value = next
}

function toggle(iso: string): void {
  setOpen([iso], !draftOpen.value.has(iso))
}

function toggleMany(isos: string[]): void {
  setOpen(isos, !allOpen(isos))
}

const pending = computed(() => ({
  open: [...draftOpen.value].filter((iso) => !savedOpen.value.has(iso)),
  close: [...savedOpen.value].filter((iso) => !draftOpen.value.has(iso)),
}))
const pendingCount = computed(() => pending.value.open.length + pending.value.close.length)

function isPending(iso: string): boolean {
  return draftOpen.value.has(iso) !== savedOpen.value.has(iso)
}

function discard(): void {
  draftOpen.value = new Set(savedOpen.value)
}

async function save(): Promise<void> {
  if (pendingCount.value === 0) return
  saving.value = true
  error.value = null
  savedMessage.value = false
  try {
    applyResponse(await updateAvailability(pending.value))
    now.value = Date.now()
    savedMessage.value = true
  } catch {
    error.value = t('admin.bookings.saveError')
  } finally {
    saving.value = false
  }
}

function cellLabel(date: string, time: string, iso: string): string {
  const booked = bookedByStart.value.get(iso)
  const state = booked
    ? t('admin.bookings.bookedBy', { company: booked.companyName })
    : draftOpen.value.has(iso)
      ? t('admin.bookings.legendOpen')
      : t('admin.bookings.legendClosed')
  return `${formatDay(date)} ${time} — ${state}`
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('admin.bookings.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('admin.bookings.subheading') }}</p>
      </div>
      <button
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
        :disabled="loading || saving"
        @click="load"
      >
        {{ loading ? t('admin.bookings.loading') : t('admin.bookings.refresh') }}
      </button>
    </div>

    <div
      v-if="error"
      class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
      role="alert"
    >
      {{ error }}
    </div>

    <div v-if="loading && !data" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-12 bg-slate-100 rounded-lg animate-pulse" />
    </div>

    <template v-else-if="data">
      <!-- Planned appointments -->
      <section>
        <h3 class="text-lg font-semibold text-slate-800 mb-3">{{ t('admin.bookings.upcoming') }}</h3>
        <p v-if="upcoming.length === 0" class="text-sm text-slate-400">
          {{ t('admin.bookings.emptyUpcoming') }}
        </p>
        <ul v-else class="grid gap-3 md:grid-cols-2">
          <li
            v-for="b in upcoming"
            :key="b.bookingId || b.start"
            class="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p class="text-xs font-medium text-indigo-600">{{ formatBookingTime(b) }}</p>
            <p class="mt-1 font-semibold text-slate-800">{{ b.companyName }}</p>
            <p class="text-sm text-slate-600">{{ b.contactName }}</p>
            <p class="mt-2 text-sm">
              <a :href="`mailto:${b.email}`" class="text-indigo-600 hover:underline">{{ b.email }}</a>
              <template v-if="b.phone">
                · <a :href="`tel:${b.phone}`" class="text-indigo-600 hover:underline">{{ b.phone }}</a>
              </template>
            </p>
            <p v-if="b.note" class="mt-2 text-sm text-slate-500 whitespace-pre-line">
              <span class="font-medium text-slate-600">{{ t('admin.bookings.note') }}:</span> {{ b.note }}
            </p>
            <button
              v-if="b.leadWebsite"
              class="mt-3 text-xs font-medium text-indigo-600 hover:underline"
              @click="openLead(b)"
            >
              {{ t('admin.bookings.viewLead') }} →
            </button>
          </li>
        </ul>

        <details v-if="past.length > 0" class="mt-4">
          <summary class="cursor-pointer text-sm font-medium text-slate-500">
            {{ t('admin.bookings.past', { count: past.length }) }}
          </summary>
          <ul class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <li
              v-for="b in past"
              :key="b.bookingId || b.start"
              class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm text-slate-600"
            >
              <span class="text-slate-400">{{ formatBookingTime(b) }}</span>
              <span class="font-medium text-slate-700">{{ b.companyName }}</span>
              <span>{{ b.contactName }}</span>
              <a :href="`mailto:${b.email}`" class="text-indigo-600 hover:underline">{{ b.email }}</a>
              <button
                v-if="b.leadWebsite"
                class="text-xs font-medium text-indigo-600 hover:underline"
                @click="openLead(b)"
              >
                {{ t('admin.bookings.viewLead') }} →
              </button>
            </li>
          </ul>
        </details>
      </section>

      <!-- Availability -->
      <section>
        <div class="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-800">{{ t('admin.bookings.availability') }}</h3>
            <p class="text-sm text-slate-500">{{ t('admin.bookings.availabilityHint') }}</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-3 rounded-sm bg-emerald-500" />{{ t('admin.bookings.legendOpen') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" />{{ t('admin.bookings.legendClosed') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-3 rounded-full bg-indigo-500" />{{ t('admin.bookings.legendBooked') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-3 rounded-sm ring-2 ring-amber-400" />{{ t('admin.bookings.legendPending') }}
            </span>
          </div>
        </div>

        <p v-if="!week" class="text-sm text-slate-400">{{ t('admin.bookings.noGrid') }}</p>

        <div v-else class="rounded-xl border border-slate-200 bg-white">
          <!-- Week navigation -->
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                class="px-2 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40"
                :disabled="weekIndex === 0"
                :aria-label="t('admin.bookings.prevWeek')"
                @click="weekIndex--"
              >
                ←
              </button>
              <span class="text-sm font-medium text-slate-700">
                {{ t('admin.bookings.weekOf', { date: formatDay(week.monday) }) }}
              </span>
              <button
                class="px-2 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40"
                :disabled="weekIndex >= weeks.length - 1"
                :aria-label="t('admin.bookings.nextWeek')"
                @click="weekIndex++"
              >
                →
              </button>
            </div>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-40"
              :disabled="weekIsos.length === 0"
              @click="toggleMany(weekIsos)"
            >
              {{ allOpen(weekIsos) ? t('admin.bookings.closeWeek') : t('admin.bookings.openWeek') }}
            </button>
          </div>

          <!-- Grid -->
          <div class="overflow-x-auto p-4">
            <table class="w-full min-w-[560px] table-fixed border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th class="w-14" />
                  <th v-for="date in week.days" :key="date" class="font-medium text-slate-600">
                    <div>{{ formatDay(date) }}</div>
                    <button
                      class="mt-1 text-[11px] font-normal text-emerald-700 hover:underline disabled:text-slate-300 disabled:no-underline"
                      :disabled="dayIsos(date).length === 0"
                      @click="toggleMany(dayIsos(date))"
                    >
                      {{ allOpen(dayIsos(date)) ? t('admin.bookings.closeDay') : t('admin.bookings.openDay') }}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="time in week.times" :key="time">
                  <th class="pr-2 text-right font-normal text-slate-400">{{ time }}</th>
                  <td v-for="date in week.days" :key="date" class="p-0">
                    <template v-if="cellIso(date, time)">
                      <div
                        v-if="bookedByStart.has(cellIso(date, time)!)"
                        class="flex h-8 items-center gap-1 truncate rounded-md bg-indigo-50 px-2 text-indigo-700"
                        :title="cellLabel(date, time, cellIso(date, time)!)"
                      >
                        <span aria-hidden="true">●</span>
                        <span class="truncate">{{ bookedByStart.get(cellIso(date, time)!)?.companyName }}</span>
                      </div>
                      <button
                        v-else
                        class="block h-8 w-full rounded-md transition-colors"
                        :class="[
                          draftOpen.has(cellIso(date, time)!)
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'border border-slate-200 bg-white hover:bg-emerald-50',
                          isPending(cellIso(date, time)!) ? 'ring-2 ring-amber-400' : '',
                        ]"
                        :aria-pressed="draftOpen.has(cellIso(date, time)!)"
                        :aria-label="cellLabel(date, time, cellIso(date, time)!)"
                        :title="cellLabel(date, time, cellIso(date, time)!)"
                        @click="toggle(cellIso(date, time)!)"
                      />
                    </template>
                    <div v-else class="h-8 rounded-md bg-slate-50" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Save bar -->
          <div class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-4 py-3">
            <span v-if="pendingCount > 0" class="text-xs text-amber-700">
              {{ t('admin.bookings.pendingCount', { count: pendingCount }) }}
            </span>
            <span v-else-if="savedMessage" class="text-xs text-emerald-700">{{ t('admin.bookings.saved') }}</span>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40"
              :disabled="pendingCount === 0 || saving"
              @click="discard"
            >
              {{ t('admin.bookings.discard') }}
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
              :disabled="pendingCount === 0 || saving"
              @click="save"
            >
              {{ saving ? t('admin.bookings.saving') : t('admin.bookings.save') }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
