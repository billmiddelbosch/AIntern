import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingForm from './BookingForm.vue'

function mountForm(hasSlot = true) {
  return mount(BookingForm, {
    props: { hasSlot, selectedLabel: 'woensdag 21 oktober · 09:00', submitting: false, submitError: null },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

async function fillValid(w: ReturnType<typeof mountForm>): Promise<void> {
  await w.find('#bk-company').setValue('  Acme  ')
  await w.find('#bk-name').setValue('Jan')
  await w.find('#bk-email').setValue('jan@acme.nl ')
  await w.find('input[type="checkbox"]').setValue(true)
}

describe('BookingForm', () => {
  it('does not submit while required fields are empty', async () => {
    const w = mountForm()
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })

  it('emits trimmed values when valid', async () => {
    const w = mountForm()
    await fillValid(w)
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')?.[0]).toEqual([
      {
        companyName: 'Acme',
        contactName: 'Jan',
        email: 'jan@acme.nl',
        phone: undefined,
        website: undefined,
        note: undefined,
        fax: '',
      },
    ])
  })

  it('does not submit without a selected slot', async () => {
    const w = mountForm(false)
    await fillValid(w)
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
  })
})
