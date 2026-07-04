import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayingCard from './PlayingCard.vue'
import nlMessages from '@/locales/nl.json'

// Tests assert against the actual locale strings (nl is the app default locale in
// src/lib/i18n.ts) rather than hardcoding translated copy, so they stay correct if
// the wording changes and still verify the i18n wiring end-to-end.
const { emptySlot, alreadyInPlay } = nlMessages.pokerOdds.card

describe('PlayingCard', () => {
  it('renders rank and suit symbol when a card is given', () => {
    const wrapper = mount(PlayingCard, { props: { card: { rank: 'A', suit: 'hearts' } } })
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('♥')
  })

  it('renders an empty placeholder when card is null', () => {
    const wrapper = mount(PlayingCard, { props: { card: null } })
    expect(wrapper.text()).toBe('')
    expect(wrapper.attributes('aria-label')).toBe(emptySlot)
  })

  it('colors hearts and diamonds red', () => {
    const hearts = mount(PlayingCard, { props: { card: { rank: 'K', suit: 'hearts' } } })
    const diamonds = mount(PlayingCard, { props: { card: { rank: 'K', suit: 'diamonds' } } })
    expect(hearts.classes()).toContain('text-rose-600')
    expect(diamonds.classes()).toContain('text-rose-600')
  })

  it('colors spades and clubs slate/black', () => {
    const spades = mount(PlayingCard, { props: { card: { rank: 'K', suit: 'spades' } } })
    const clubs = mount(PlayingCard, { props: { card: { rank: 'K', suit: 'clubs' } } })
    expect(spades.classes()).toContain('text-slate-900')
    expect(clubs.classes()).toContain('text-slate-900')
  })

  it('emits click when interactive and not disabled', async () => {
    const wrapper = mount(PlayingCard, {
      props: { card: { rank: 'A', suit: 'spades' }, interactive: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when not interactive', async () => {
    const wrapper = mount(PlayingCard, { props: { card: { rank: 'A', suit: 'spades' } } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not emit click when disabled, and reflects disabled state in the DOM', async () => {
    const wrapper = mount(PlayingCard, {
      props: { card: { rank: 'A', suit: 'spades' }, interactive: true, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-label')).toContain(alreadyInPlay)
  })

  it('applies a highlight ring when highlight=true', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: null, highlight: true },
    })
    expect(wrapper.classes().some((cls) => cls.includes('ring'))).toBe(true)
  })
})
