import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProbleemOplossingSection from './ProbleemOplossingSection.vue'
import ProbleemOplossingCard from './ProbleemOplossingCard.vue'
import ProbleemOplossingPair from './ProbleemOplossingPair.vue'
import type { ProbleemOplossingPair as PairType } from '@/../product/sections/problemen-oplossingen/types'
import data from '@/../product/sections/problemen-oplossingen/data.json'

const mockPairs = data.pairs as PairType[]

describe('ProbleemOplossingSection', () => {
  it('renders without errors', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('has id="problemen-oplossingen" for anchor navigation', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    expect(wrapper.find('#problemen-oplossingen').exists()).toBe(true)
  })

  it('renders exactly three ProbleemOplossingPair components', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    const pairs = wrapper.findAllComponents(ProbleemOplossingPair)
    expect(pairs).toHaveLength(3)
  })

  it('renders section eyebrow label', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    const eyebrow = wrapper.find('.pos-eyebrow')
    expect(eyebrow.exists()).toBe(true)
    // Should have text (either NL or EN)
    expect(eyebrow.text().length).toBeGreaterThan(0)
  })

  it('renders the H2 title', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    const title = wrapper.find('h2')
    expect(title.exists()).toBe(true)
    expect(title.text().length).toBeGreaterThan(0)
  })

  it('passes correct pair index to each ProbleemOplossingPair', () => {
    const wrapper = mount(ProbleemOplossingSection, {
      props: { pairs: mockPairs },
    })
    const pairComponents = wrapper.findAllComponents(ProbleemOplossingPair)
    pairComponents.forEach((pairWrapper, i) => {
      expect(pairWrapper.props('index')).toBe(i)
    })
  })
})

describe('ProbleemOplossingCard', () => {
  it('renders problem variant with correct CSS class', () => {
    const wrapper = mount(ProbleemOplossingCard, {
      props: {
        title: 'Test probleem',
        description: 'Een beschrijving van het probleem.',
        icon: 'clock',
        variant: 'problem',
      },
      slots: { label: 'Uitdaging' },
    })
    expect(wrapper.find('.poc-card--problem').exists()).toBe(true)
    expect(wrapper.find('.poc-card--solution').exists()).toBe(false)
  })

  it('renders solution variant with correct CSS class', () => {
    const wrapper = mount(ProbleemOplossingCard, {
      props: {
        title: 'Test oplossing',
        description: 'Een beschrijving van de oplossing.',
        icon: 'zap',
        variant: 'solution',
      },
      slots: { label: 'Onze aanpak' },
    })
    expect(wrapper.find('.poc-card--solution').exists()).toBe(true)
    expect(wrapper.find('.poc-card--problem').exists()).toBe(false)
  })

  it('renders title and description', () => {
    const wrapper = mount(ProbleemOplossingCard, {
      props: {
        title: 'Mijn Titel',
        description: 'Mijn beschrijving hier.',
        icon: 'zap',
        variant: 'solution',
      },
      slots: { label: 'Label' },
    })
    expect(wrapper.find('.poc-card__title').text()).toBe('Mijn Titel')
    expect(wrapper.find('.poc-card__description').text()).toBe('Mijn beschrijving hier.')
  })

  it('renders an SVG icon', () => {
    const wrapper = mount(ProbleemOplossingCard, {
      props: {
        title: 'T',
        description: 'D',
        icon: 'clock',
        variant: 'problem',
      },
      slots: { label: 'L' },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

describe('ProbleemOplossingPair', () => {
  it('renders both problem and solution cards', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[0], index: 0 },
    })
    const cards = wrapper.findAllComponents(ProbleemOplossingCard)
    expect(cards).toHaveLength(2)
  })

  it('first card is problem variant', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[0], index: 0 },
    })
    const cards = wrapper.findAllComponents(ProbleemOplossingCard)
    expect(cards[0].props('variant')).toBe('problem')
  })

  it('second card is solution variant', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[0], index: 0 },
    })
    const cards = wrapper.findAllComponents(ProbleemOplossingCard)
    expect(cards[1].props('variant')).toBe('solution')
  })

  it('applies poc-pair--reversed class on odd index', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[1], index: 1 },
    })
    expect(wrapper.find('.poc-pair--reversed').exists()).toBe(true)
  })

  it('does not apply poc-pair--reversed class on even index', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[0], index: 0 },
    })
    expect(wrapper.find('.poc-pair--reversed').exists()).toBe(false)
  })

  it('renders a connector SVG arrow', () => {
    const wrapper = mount(ProbleemOplossingPair, {
      props: { pair: mockPairs[0], index: 0 },
    })
    expect(wrapper.find('.poc-pair__divider').exists()).toBe(true)
    expect(wrapper.find('.poc-pair__divider svg').exists()).toBe(true)
  })
})
