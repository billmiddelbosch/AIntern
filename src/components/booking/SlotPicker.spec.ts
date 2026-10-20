import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SlotPicker from './SlotPicker.vue'

const SLOTS = ['2026-10-21T07:00:00.000Z', '2026-10-21T07:30:00.000Z', '2026-10-22T08:00:00.000Z']

function mountPicker(modelValue: string | null = null) {
  return mount(SlotPicker, {
    props: { slots: SLOTS, loading: false, error: false, taken: false, modelValue },
  })
}

function times(w: ReturnType<typeof mountPicker>): string[] {
  return w
    .findAll('[role="listbox"]')[1]
    .findAll('button')
    .map((b) => b.text())
}

describe('SlotPicker', () => {
  it('shows one day chip per day and the times of the first day', () => {
    const w = mountPicker()
    expect(w.findAll('[data-testid="day-strip"] button')).toHaveLength(2)
    expect(times(w)).toEqual(['09:00', '09:30'])
  })

  it('emits the chosen slot', async () => {
    const w = mountPicker()
    await w.findAll('[role="listbox"]')[1].findAll('button')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['2026-10-21T07:30:00.000Z'])
  })

  it('clears the chosen slot when another day is picked', async () => {
    const w = mountPicker('2026-10-21T07:00:00.000Z')
    await w.findAll('[data-testid="day-strip"] button')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([null])
    expect(times(w)).toEqual(['10:00'])
  })

  it('shows a retry button on error', async () => {
    const w = mount(SlotPicker, {
      props: { slots: [], loading: false, error: true, taken: false, modelValue: null },
    })
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })
})
