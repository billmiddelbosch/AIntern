import { describe, it, expect } from 'vitest'
import { useAvailabilityDraft } from './useAvailabilityDraft'

describe('useAvailabilityDraft', () => {
  it('starts from the saved state without changes', () => {
    const d = useAvailabilityDraft()
    d.reset(['a', 'b'])
    expect([...d.draft.value]).toEqual(['a', 'b'])
    expect(d.pendingCount.value).toBe(0)
  })

  it('opens all given blocks, or closes them when all are open', () => {
    const d = useAvailabilityDraft()
    d.reset(['a'])
    d.toggle(['a', 'b'])
    expect(d.allOpen(['a', 'b'])).toBe(true)
    expect(d.changes.value).toEqual({ open: ['b'], close: [] })
    d.toggle(['a', 'b'])
    expect(d.changes.value).toEqual({ open: [], close: ['a'] })
    expect([...d.changed.value]).toEqual(['a'])
  })

  it('discards unsaved changes', () => {
    const d = useAvailabilityDraft()
    d.reset(['a'])
    d.toggle(['c'])
    d.discard()
    expect(d.pendingCount.value).toBe(0)
    expect(d.allOpen(['a'])).toBe(true)
  })

  it('never reports a change for an empty toggle', () => {
    const d = useAvailabilityDraft()
    d.reset([])
    d.toggle([])
    expect(d.pendingCount.value).toBe(0)
  })
})
