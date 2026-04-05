# Intake Funnel Specification

**Atomic Level**: Organism (IntakeModal) + Organism (BookingModal)

## Overview
A two-stage funnel triggered by the primary CTA ("Gratis kennismaking" / "Free consultation"). Before the visitor lands in the Calendly booking flow, they first complete a 5-step pre-qualification intake. The intake answers are submitted fire-and-forget to a backend endpoint; on completion the intake modal closes and the booking modal opens.

## User Flow
1. Visitor clicks any CTA that calls `openIntakeModal()`
2. `IntakeModal` opens — 5 sequential steps with a progress bar
3. On final step submission: answers are posted to `VITE_INTAKE_ENDPOINT`; modal closes
4. `BookingModal` opens immediately — visitor picks a Calendly slot
5. If visitor closes `IntakeModal` mid-flow, form resets; booking modal does **not** open

## Steps

| # | Field | Type | Key |
|---|-------|------|-----|
| 1 | Company size | Multiple choice (xs/s/m/l → 1-5 / 6-20 / 21-50 / 50+) | `companySize` |
| 2 | Process description | Free-text textarea | `processDescription` |
| 3 | Process duration | Multiple choice (xs/s/m/l → <15min / 15-60min / 1-4h / >4h) | `processDuration` |
| 4 | Tried to automate before | Multiple choice (yes / no / partial) | `triedBefore` |
| 5 | Business impact | Free-text textarea | `impact` |

All steps require a non-empty answer before advancing. Validation triggers only after the user first clicks "Next" (touched flag).

## Submission
- Endpoint: `VITE_INTAKE_ENDPOINT` (env var; if absent, submission is silently skipped)
- Method: `POST`, `Content-Type: application/json`
- Payload: `{ email, companySize, processDescription, processDuration, triedBefore, impact }`
- `email` is currently hardcoded as `unknown@aintern.nl` — TODO I-05: replace with real email
- Submission is **fire-and-forget**: errors are swallowed so UX is never blocked
- Uses the configured axios instance (`src/lib/axios.ts`)

## Components & Composables
- `src/components/ui/IntakeModal.vue` — multi-step form UI, local state only
- `src/components/ui/BookingModal.vue` — Calendly modal, opened after intake completes
- `src/composables/useIntakeForm.ts` — `submitIntakeAnswers(answers: IntakeAnswers): Promise<void>`
- `src/composables/useIntakeModal.ts` — `isOpen`, `openIntakeModal()`, `closeIntakeModal()`
- `src/composables/useBookingModal.ts` — `isOpen`, `openBookingModal()`, `closeBookingModal()`

## i18n
All UI strings live under `intakeModal.*` in `en.json` / `nl.json`.

## Configuration
- shell: true
