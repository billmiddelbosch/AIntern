/**
 * newsanalyzer.test.ts
 *
 * Unit tests for the pure priority-topic helpers in newsanalyzer.ts.
 * These are exported, dependency-free functions, so no AWS/Anthropic mocking is needed.
 */

import { describe, it, expect } from 'vitest'
import { matchesPriorityTopic, applyPriorityTopicBoost } from './newsanalyzer'

describe('matchesPriorityTopic', () => {
  it('returns the matched topic on a case-insensitive substring match', () => {
    const result = matchesPriorityTopic(
      'Kabinet kondigt nieuwe AI-regulering aan voor MKB',
      ['ai-regulering', 'Lightspeed'],
    )
    expect(result).toBe('ai-regulering')
  })

  it('matches regardless of the casing used in the topic list', () => {
    const result = matchesPriorityTopic('LIGHTSPEED lanceert nieuwe kassa-app', ['Lightspeed'])
    expect(result).toBe('Lightspeed')
  })

  it('returns null when no topic matches', () => {
    const result = matchesPriorityTopic('Het weer wordt morgen zonnig', ['ai-regulering', 'Lightspeed'])
    expect(result).toBeNull()
  })

  it('returns null for an empty topics list', () => {
    const result = matchesPriorityTopic('Kabinet kondigt nieuwe AI-regulering aan', [])
    expect(result).toBeNull()
  })

  it('ignores blank/whitespace-only topic entries', () => {
    const result = matchesPriorityTopic('Kabinet kondigt nieuwe AI-regulering aan', ['   ', ''])
    expect(result).toBeNull()
  })

  it('returns the first matching topic when multiple topics match', () => {
    const result = matchesPriorityTopic(
      'AI-regulering en Lightspeed komen beide in het nieuws',
      ['AI-regulering', 'Lightspeed'],
    )
    expect(result).toBe('AI-regulering')
  })
})

describe('applyPriorityTopicBoost', () => {
  it('leaves urgency and reason unchanged when no topic matched', () => {
    const result = applyPriorityTopicBoost(50, 'Relevant voor MKB owners', null)
    expect(result).toEqual({ urgency: 50, urgencyReason: 'Relevant voor MKB owners' })
  })

  it('boosts urgency by 20 and annotates the reason when a topic matched', () => {
    const result = applyPriorityTopicBoost(50, 'Relevant voor MKB owners', 'Lightspeed')
    expect(result.urgency).toBe(70)
    expect(result.urgencyReason).toBe('Relevant voor MKB owners [Prioriteit: "Lightspeed" +20]')
  })

  it('caps the boosted urgency at 100', () => {
    const result = applyPriorityTopicBoost(90, 'Zeer urgent', 'AI-regulering')
    expect(result.urgency).toBe(100)
  })

  it('caps the boosted urgency at 100 even when already at the max', () => {
    const result = applyPriorityTopicBoost(100, 'Maximale urgentie', 'AI-regulering')
    expect(result.urgency).toBe(100)
  })
})
