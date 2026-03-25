import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultatenCasesSection from './ResultatenCasesSection.vue'
import ResultaatCard from './ResultaatCard.vue'
import type { ResultaatCase } from '@/../product/sections/resultaten-cases/types'
import data from '@/../product/sections/resultaten-cases/data.json'

const mockCases = data.cases as ResultaatCase[]

describe('ResultatenCasesSection', () => {
  it('renders without errors', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('has id="resultaten-cases" for anchor navigation', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    expect(wrapper.find('#resultaten-cases').exists()).toBe(true)
  })

  it('renders exactly four ResultaatCard components', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    const cards = wrapper.findAllComponents(ResultaatCard)
    expect(cards).toHaveLength(4)
  })

  it('renders section eyebrow label', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    const eyebrow = wrapper.find('.rc-eyebrow')
    expect(eyebrow.exists()).toBe(true)
    expect(eyebrow.text().length).toBeGreaterThan(0)
  })

  it('renders the H2 title', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    const title = wrapper.find('h2')
    expect(title.exists()).toBe(true)
    expect(title.text().length).toBeGreaterThan(0)
  })

  it('renders the grid container', () => {
    const wrapper = mount(ResultatenCasesSection, {
      props: { cases: mockCases },
    })
    expect(wrapper.find('.rc-grid').exists()).toBe(true)
  })
})

describe('ResultaatCard', () => {
  const caseTimeSaving = mockCases.find((c) => c.tag === 'tijdsbesparing')!
  const caseCostSaving = mockCases.find((c) => c.tag === 'kostenbesparing')!
  const caseGroei = mockCases.find((c) => c.tag === 'groei')!
  const caseKwaliteit = mockCases.find((c) => c.tag === 'kwaliteit')!

  it('renders the metric value', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    expect(wrapper.find('.rc-card__metric-value').text()).toBe(caseTimeSaving.metric)
  })

  it('renders the metric unit when provided', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    expect(wrapper.find('.rc-card__metric-unit').exists()).toBe(true)
    expect(wrapper.find('.rc-card__metric-unit').text()).toBe(caseTimeSaving.metricUnit)
  })

  it('does not render metric unit element when unit is empty string', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseGroei } })
    expect(wrapper.find('.rc-card__metric-unit').exists()).toBe(false)
  })

  it('applies tijdsbesparing colour class', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    expect(wrapper.find('.rc-card--tijdsbesparing').exists()).toBe(true)
  })

  it('applies kostenbesparing colour class', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseCostSaving } })
    expect(wrapper.find('.rc-card--kostenbesparing').exists()).toBe(true)
  })

  it('applies groei colour class', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseGroei } })
    expect(wrapper.find('.rc-card--groei').exists()).toBe(true)
  })

  it('applies kwaliteit colour class', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseKwaliteit } })
    expect(wrapper.find('.rc-card--kwaliteit').exists()).toBe(true)
  })

  it('renders title and description in default locale (nl)', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    const title = wrapper.find('.rc-card__title')
    const desc = wrapper.find('.rc-card__description')
    expect(title.text()).toBe(caseTimeSaving.nl.title)
    expect(desc.text()).toBe(caseTimeSaving.nl.description)
  })

  it('renders tag badge with non-empty text', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    const tag = wrapper.find('.rc-card__tag')
    expect(tag.exists()).toBe(true)
    expect(tag.text().length).toBeGreaterThan(0)
  })

  it('renders an SVG icon', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    expect(wrapper.find('.rc-card__icon-wrap svg').exists()).toBe(true)
  })

  it('renders the metric label', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    const label = wrapper.find('.rc-card__metric-label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe(caseTimeSaving.nl.metricLabel)
  })

  it('renders a divider element', () => {
    const wrapper = mount(ResultaatCard, { props: { case: caseTimeSaving } })
    expect(wrapper.find('.rc-card__divider').exists()).toBe(true)
  })
})
