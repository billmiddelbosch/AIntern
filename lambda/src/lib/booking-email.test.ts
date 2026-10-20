import { describe, it, expect } from 'vitest'
import {
  buildIcs,
  buildLeadMail,
  buildOwnerMail,
  oneLine,
  escapeHtml,
  address,
  type BookingDetails,
} from './booking-email'

const base: BookingDetails = {
  bookingId: 'b-123',
  start: '2026-10-21T07:00:00.000Z',
  end: '2026-10-21T07:30:00.000Z',
  companyName: 'Bakkerij De Vries, B.V.',
  contactName: 'Jan de Vries',
  email: 'jan@bakkerij.nl',
  phone: '+31 6 12345678',
  website: 'https://bakkerij.nl',
  note: 'Wij willen <b>offertes</b> automatiseren',
  locale: 'nl',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
}

/** Decode every base64 MIME body so assertions can look at the content. */
function decodeParts(raw: string): string {
  return raw
    .split('\r\n\r\n')
    .map((chunk) => {
      const body = chunk.split('\r\n--')[0].replace(/\r\n/g, '')
      return /^[A-Za-z0-9+/=]+$/.test(body) && body.length > 20
        ? Buffer.from(body, 'base64').toString('utf8')
        : chunk
    })
    .join('\n')
}

describe('helpers', () => {
  it('oneLine strips CR/LF (header injection)', () => {
    expect(oneLine('evil\r\nBcc: x@y.z')).toBe('evil Bcc: x@y.z')
  })
  it('escapeHtml escapes markup', () => {
    expect(escapeHtml(`<script>"&'`)).toBe('&lt;script&gt;&quot;&amp;&#39;')
  })
})

describe('buildIcs', () => {
  it('produces a valid VEVENT with UTC times and escaped text', () => {
    const ics = buildIcs(base, 'REQUEST', '2026-10-20T08:00:00.000Z')
    expect(ics).toContain('METHOD:REQUEST')
    expect(ics).toContain('UID:b-123@aintern.nl')
    expect(ics).toContain('DTSTART:20261021T070000Z')
    expect(ics).toContain('DTEND:20261021T073000Z')
    expect(ics).toContain('ORGANIZER;CN="Bill Middelbosch":mailto:b.middelbosch@bm-c.nl')
    expect(ics).toContain('LOCATION:https://meet.google.com/abc-defg-hij')
    expect(ics.replace(/\r\n /g, '')).toContain('Bakkerij De Vries\\, B.V.')
    for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
  })
})

describe('buildLeadMail', () => {
  it('goes to the lead, reply-to Bill, with invite attached', () => {
    const raw = buildLeadMail(base, '2026-10-20T08:00:00.000Z', 'seed')
    expect(raw).toContain('To: =?UTF-8?B?SmFuIGRlIFZyaWVz?= <jan@bakkerij.nl>')
    expect(raw).toContain('Reply-To: =?UTF-8?B?QmlsbCBNaWRkZWxib3NjaA==?= <b.middelbosch@bm-c.nl>')
    expect(raw).toContain('method=REQUEST')
    expect(raw).toContain('filename="afspraak.ics"')
    const decoded = decodeParts(raw)
    expect(decoded).toContain('woensdag 21 oktober 2026 om 09:00')
    expect(decoded).toContain('https://meet.google.com/abc-defg-hij')
  })

  it('falls back to a text when no meeting URL is configured', () => {
    const decoded = decodeParts(
      buildLeadMail({ ...base, meetingUrl: undefined }, '2026-10-20T08:00:00.000Z', 's'),
    )
    expect(decoded).toContain('De videolink ontvang je voor het gesprek per mail.')
  })

  it('cannot inject headers through the contact name', () => {
    const raw = buildLeadMail(
      { ...base, contactName: 'X\r\nBcc: spam@evil.com' },
      '2026-10-20T08:00:00.000Z',
      's',
    )
    expect(raw).not.toMatch(/^Bcc:/m)
  })
})

describe('address', () => {
  it('encodes the display name so it cannot add recipients', () => {
    const header = address('Evil <attacker@x.com>, Jan', 'jan@bakkerij.nl')
    expect(header).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <jan@bakkerij\.nl>$/)
    expect(header).not.toContain('attacker@x.com')
    expect(address('', 'a@b.nl')).toBe('<a@b.nl>')
  })

  it('keeps the note out of the invite sent to the lead', () => {
    const icsPart = decodeParts(buildLeadMail(base, '2026-10-20T08:00:00.000Z', 'seed'))
    expect(icsPart).toContain('METHOD:REQUEST')
    expect(icsPart).not.toContain('offertes')
  })
})

describe('buildOwnerMail', () => {
  it('notifies Bill with lead details, escaped HTML and CRM link', () => {
    const raw = buildOwnerMail(base, 'https://aintern.nl/admin/leads/x', '2026-10-20T08:00:00.000Z', 'seed')
    expect(raw).toContain('To: =?UTF-8?B?QmlsbCBNaWRkZWxib3NjaA==?= <b.middelbosch@bm-c.nl>')
    expect(raw).toContain('Reply-To: =?UTF-8?B?SmFuIGRlIFZyaWVz?= <jan@bakkerij.nl>')
    expect(raw).toContain('method=PUBLISH')
    const decoded = decodeParts(raw)
    expect(decoded).toContain('Bakkerij De Vries, B.V.')
    expect(decoded).toContain('+31 6 12345678')
    expect(decoded).toContain('&lt;b&gt;offertes&lt;/b&gt;')
    expect(decoded).toContain('https://aintern.nl/admin/leads/x')
  })
})
