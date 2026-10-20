/**
 * Builds the confirmation e-mails (with .ics invite) for the booking page.
 * Output is a raw MIME message for SES SendRawEmail. Pure functions only.
 */

import { formatSlotLabel } from './booking-slots'

export interface BookingDetails {
  bookingId: string
  start: string // UTC ISO
  end: string // UTC ISO
  companyName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  note?: string
  locale: 'nl' | 'en'
  meetingUrl?: string
}

export const ORGANIZER_NAME = 'Bill Middelbosch'
export const ORGANIZER_EMAIL = 'b.middelbosch@bm-c.nl'
export const SENDER = 'AIntern <sanne@aintern.nl>'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Remove CR/LF and other control chars — prevents header injection. */
export function oneLine(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function encodeHeader(value: string): string {
  const clean = oneLine(value)
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7e]*$/.test(clean)
    ? clean
    : `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`
}

/**
 * The display name is always RFC 2047-encoded, so characters like "," ";" or "<"
 * in user input can never be read as extra recipients.
 */
export function address(name: string, email: string): string {
  const clean = oneLine(name).trim()
  const display = clean ? `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?= ` : ''
  return `${display}<${oneLine(email)}>`
}

function base64Lines(content: string): string {
  return (Buffer.from(content, 'utf8').toString('base64').match(/.{1,76}/g) ?? []).join('\r\n')
}

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
}

function icsParam(value: string): string {
  return `"${oneLine(value).replace(/[";:,]/g, '')}"`
}

/** Fold content lines at 75 octets (RFC 5545 §3.1), UTF-8 aware. */
function foldLine(line: string): string {
  const out: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const len = Buffer.byteLength(ch, 'utf8')
    const limit = out.length === 0 ? 75 : 74 // continuation lines start with a space
    if (bytes + len > limit) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += len
  }
  out.push(current)
  return out.join('\r\n ')
}

// ── .ics ─────────────────────────────────────────────────────────────────────

export function buildIcs(b: BookingDetails, method: 'REQUEST' | 'PUBLISH', nowIso: string): string {
  const summary =
    b.locale === 'nl'
      ? `Kennismaking AIntern × ${oneLine(b.companyName)}`
      : `AIntern intro call × ${oneLine(b.companyName)}`
  const description = [
    b.meetingUrl ? `Video: ${b.meetingUrl}` : '',
    `${b.locale === 'nl' ? 'Bedrijf' : 'Company'}: ${b.companyName}`,
    `${b.locale === 'nl' ? 'Contact' : 'Contact'}: ${b.contactName} (${b.email}${b.phone ? `, ${b.phone}` : ''})`,
    // The lead's own invite (REQUEST) never carries the free-text note
    b.note && method === 'PUBLISH' ? `\n${b.note}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIntern//Booking//NL',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${b.bookingId}@aintern.nl`,
    `DTSTAMP:${icsDate(nowIso)}`,
    `DTSTART:${icsDate(b.start)}`,
    `DTEND:${icsDate(b.end)}`,
    `SUMMARY:${icsText(summary)}`,
    `DESCRIPTION:${icsText(description)}`,
    // URL values are not TEXT, so no escaping: only strip line breaks
    ...(b.meetingUrl ? [`LOCATION:${oneLine(b.meetingUrl)}`, `URL:${oneLine(b.meetingUrl)}`] : []),
    `ORGANIZER;CN=${icsParam(ORGANIZER_NAME)}:mailto:${ORGANIZER_EMAIL}`,
    `ATTENDEE;CN=${icsParam(b.contactName)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${oneLine(b.email)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

// ── MIME ─────────────────────────────────────────────────────────────────────

interface RawMailInput {
  from: string
  to: string
  replyTo?: string
  subject: string
  text: string
  html: string
  ics: string
  icsMethod: 'REQUEST' | 'PUBLISH'
}

export function buildRawMail(m: RawMailInput, boundarySeed: string): string {
  const mixed = `mixed_${boundarySeed}`
  const alt = `alt_${boundarySeed}`
  const headers = [
    `From: ${m.from}`,
    `To: ${m.to}`,
    ...(m.replyTo ? [`Reply-To: ${m.replyTo}`] : []),
    `Subject: ${encodeHeader(m.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
  ]
  const parts = [
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    '',
    `--${alt}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(m.text),
    `--${alt}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(m.html),
    `--${alt}`,
    `Content-Type: text/calendar; charset=UTF-8; method=${m.icsMethod}`,
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(m.ics),
    `--${alt}--`,
    '',
    `--${mixed}`,
    'Content-Type: application/ics; name="afspraak.ics"',
    'Content-Disposition: attachment; filename="afspraak.ics"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(m.ics),
    `--${mixed}--`,
    '',
  ]
  return [...headers, '', ...parts].join('\r\n')
}

// ── Mail content ─────────────────────────────────────────────────────────────

function htmlShell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">${inner}</div>
</body></html>`
}

export function buildLeadMail(b: BookingDetails, nowIso: string, boundarySeed: string): string {
  const when = formatSlotLabel(b.start, b.locale)
  const nl = b.locale === 'nl'
  const subject = nl
    ? `Bevestiging: kennismaking met AIntern op ${when}`
    : `Confirmed: intro call with AIntern on ${when}`
  const videoLineText = b.meetingUrl
    ? `${nl ? 'Videolink' : 'Video link'}: ${b.meetingUrl}`
    : nl
      ? 'De videolink ontvang je voor het gesprek per mail.'
      : 'You will receive the video link by e-mail before the call.'

  const text = [
    nl ? `Hoi ${b.contactName},` : `Hi ${b.contactName},`,
    '',
    nl
      ? `Bedankt voor het plannen van een kennismakingsgesprek. Je afspraak staat vast:`
      : `Thanks for booking an intro call. Your meeting is confirmed:`,
    '',
    `${nl ? 'Wanneer' : 'When'}: ${when} (30 min)`,
    videoLineText,
    '',
    nl
      ? 'De agenda-uitnodiging zit als bijlage bij deze mail. Kun je toch niet? Beantwoord deze mail, dan zoeken we een ander moment.'
      : 'The calendar invite is attached. Can’t make it? Just reply to this e-mail and we’ll find another time.',
    '',
    nl ? 'Tot dan!' : 'Talk soon!',
    '',
    `Bill Middelbosch — AIntern — aintern.nl`,
  ].join('\n')

  const videoHtml = b.meetingUrl
    ? `<p style="margin:0 0 6px;"><strong>${nl ? 'Videolink' : 'Video link'}:</strong> <a href="${escapeHtml(b.meetingUrl)}" style="color:#4f46e5;">${escapeHtml(b.meetingUrl)}</a></p>`
    : `<p style="margin:0 0 6px;">${escapeHtml(videoLineText)}</p>`

  const html = htmlShell(`
<h1 style="font-size:20px;margin:0 0 16px;">${nl ? 'Je afspraak staat vast' : 'Your meeting is confirmed'}</h1>
<p style="margin:0 0 16px;">${escapeHtml(nl ? `Hoi ${b.contactName},` : `Hi ${b.contactName},`)}</p>
<p style="margin:0 0 16px;">${nl ? 'Bedankt voor het plannen van een kennismakingsgesprek met AIntern.' : 'Thanks for booking an intro call with AIntern.'}</p>
<div style="background:#eef2ff;border-radius:8px;padding:16px;margin:0 0 16px;">
<p style="margin:0 0 6px;"><strong>${nl ? 'Wanneer' : 'When'}:</strong> ${escapeHtml(when)} (30 min)</p>
${videoHtml}
</div>
<p style="margin:0 0 16px;">${nl ? 'De agenda-uitnodiging zit als bijlage bij deze mail. Kun je toch niet? Beantwoord deze mail, dan zoeken we een ander moment.' : 'The calendar invite is attached. Can’t make it? Just reply to this e-mail and we’ll find another time.'}</p>
<p style="margin:0;">${nl ? 'Tot dan!' : 'Talk soon!'}<br>Bill Middelbosch — <a href="https://aintern.nl" style="color:#4f46e5;">AIntern</a></p>`)

  return buildRawMail(
    {
      from: SENDER,
      to: address(b.contactName, b.email),
      replyTo: address(ORGANIZER_NAME, ORGANIZER_EMAIL),
      subject,
      text,
      html,
      ics: buildIcs(b, 'REQUEST', nowIso),
      icsMethod: 'REQUEST',
    },
    boundarySeed,
  )
}

export function buildOwnerMail(
  b: BookingDetails,
  adminLeadUrl: string,
  nowIso: string,
  boundarySeed: string,
): string {
  const when = formatSlotLabel(b.start, 'nl')
  const rows: [string, string][] = [
    ['Wanneer', `${when} (30 min)`],
    ['Bedrijf', b.companyName],
    ['Naam', b.contactName],
    ['E-mail', b.email],
    ['Telefoon', b.phone ?? '—'],
    ['Website', b.website ?? '—'],
    ['Taal', b.locale.toUpperCase()],
    ['Opmerking', b.note ?? '—'],
  ]
  const subject = `Nieuwe afspraak: ${b.companyName} — ${when}`
  const text = [
    'Er is een nieuwe kennismaking ingepland via aintern.nl.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Lead in CRM: ${adminLeadUrl}`,
  ].join('\n')
  const html = htmlShell(`
<h1 style="font-size:20px;margin:0 0 16px;">Nieuwe afspraak ingepland</h1>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin:20px 0 0;"><a href="${escapeHtml(adminLeadUrl)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;">Open lead in CRM</a></p>`)

  return buildRawMail(
    {
      from: SENDER,
      to: address(ORGANIZER_NAME, ORGANIZER_EMAIL),
      replyTo: address(b.contactName, b.email),
      subject,
      text,
      html,
      ics: buildIcs(b, 'PUBLISH', nowIso),
      icsMethod: 'PUBLISH',
    },
    boundarySeed,
  )
}
