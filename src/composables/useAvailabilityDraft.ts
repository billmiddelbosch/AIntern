import { computed, ref } from 'vue'
import type { AvailabilityChange } from '@/types/booking'

/**
 * Local editor state for the availability planner: which blocks are open in the
 * database (saved) and which are open in the editor (draft, incl. unsaved changes).
 */
export function useAvailabilityDraft() {
  const saved = ref<ReadonlySet<string>>(new Set())
  const draft = ref<ReadonlySet<string>>(new Set())

  function reset(open: readonly string[]): void {
    saved.value = new Set(open)
    draft.value = new Set(open)
  }

  function allOpen(isos: readonly string[]): boolean {
    return isos.length > 0 && isos.every((iso) => draft.value.has(iso))
  }

  function setOpen(isos: readonly string[], open: boolean): void {
    const next = new Set(draft.value)
    for (const iso of isos) {
      if (open) next.add(iso)
      else next.delete(iso)
    }
    draft.value = next
  }

  /** Opens all given blocks, or closes them when they are all open already. */
  function toggle(isos: readonly string[]): void {
    setOpen(isos, !allOpen(isos))
  }

  function discard(): void {
    draft.value = new Set(saved.value)
  }

  const changes = computed<AvailabilityChange>(() => ({
    open: [...draft.value].filter((iso) => !saved.value.has(iso)),
    close: [...saved.value].filter((iso) => !draft.value.has(iso)),
  }))
  const changed = computed<ReadonlySet<string>>(
    () => new Set([...changes.value.open, ...changes.value.close]),
  )
  const pendingCount = computed(() => changed.value.size)

  return { draft, reset, allOpen, toggle, discard, changes, changed, pendingCount }
}
