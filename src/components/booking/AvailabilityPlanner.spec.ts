import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AvailabilityPlanner from './AvailabilityPlanner.vue'
import type { AdminBooking } from '@/types/booking'

const GRID = ['2026-10-21T07:00:00.000Z', '2026-10-21T07:30:00.000Z', '2026-10-21T08:00:00.000Z']
const BOOKING: AdminBooking = {
  bookingId: 'b1',
  start: '2026-10-21T08:00:00.000Z',
  end: '2026-10-21T08:30:00.000Z',
  companyName: 'Acme',
  contactName: 'Jan',
  email: 'jan@acme.nl',
}

function mountPlanner() {
  return mount(AvailabilityPlanner, {
    props: { grid: GRID, open: [GRID[0]], bookings: [BOOKING], saving: false, saved: false },
  })
}

function rows(w: ReturnType<typeof mountPlanner>) {
  return w.findAll('[data-testid="day-blocks"] li')
}

async function clickSave(w: ReturnType<typeof mountPlanner>): Promise<void> {
  await w.find('[data-testid="save-bar"]').findAll('button')[1].trigger('click')
}

describe('AvailabilityPlanner', () => {
  it('lists the blocks of the first day; booked blocks are not clickable', () => {
    const r = rows(mountPlanner())
    expect(r).toHaveLength(3)
    expect(r[0].find('button').attributes('aria-pressed')).toBe('true')
    expect(r[1].find('button').attributes('aria-pressed')).toBe('false')
    expect(r[2].find('button').exists()).toBe(false)
    expect(r[2].text()).toContain('Acme')
  })

  it('emits only the diff on save', async () => {
    const w = mountPlanner()
    await rows(w)[0].find('button').trigger('click') // close 09:00
    await rows(w)[1].find('button').trigger('click') // open 09:30
    await clickSave(w)
    expect(w.emitted('save')?.[0]).toEqual([{ open: [GRID[1]], close: [GRID[0]] }])
  })

  it('opens a whole day except booked blocks', async () => {
    const w = mountPlanner()
    await w.find('[data-testid="day-toggle"]').trigger('click')
    await clickSave(w)
    expect(w.emitted('save')?.[0]).toEqual([{ open: [GRID[1]], close: [] }])
  })
})
