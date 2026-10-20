# Eigen agenda (Booking) — Specification

## Backlog ID
Vervanger Calendly (feature/replaceCalendry) + mobile-first refactor (feature/mobileFirst)

## Atomic Level
FEATURE (publieke route `/afspraak` + admin route `/admin/afspraken`)

## Overview
AIntern plant kennismakingsgesprekken via een eigen agenda in plaats van Calendly. De lead kiest een vrij blok op `/afspraak` en vult bedrijfsnaam en contactgegevens in. De boeking komt in DynamoDB (`aintern-admin`) en Bill krijgt een notificatie. De lead ontvangt een bevestigingsmail met .ics. In de admin ziet Bill de geplande afspraken en zet hij zelf blokken open of dicht.

## Atomic Rationale
De eerste versie bestond uit twee grote PAGE-bestanden (±400–600 regels) met een desktop-weektabel van `min-w-[560px]` en tap targets van 28–32px. Daardoor scrolde de pagina op een telefoon horizontaal en waren de knoppen te klein. De refactor splitst alles volgens Atomic Design:

- **ATOMs** (`components/ui/`) zijn kleine, herbruikbare bouwstenen met mobiele maten ingebakken (≥44px hoog, `text-base` op mobiel tegen iOS-zoom).
- **MOLECULEs** combineren atoms tot één functie, zoals een dagstrip of een lijst met tijden.
- **ORGANISMs** bevatten de feature-logica, zoals slotkeuze, formulier en beschikbaarheidsplanner.
- **PAGEs** halen alleen data op en verbinden de organisms.

Mobiel is de standaard. De weektabel verschijnt pas vanaf `lg`. Daaronder kies je eerst een dag en tik je daarna op rijen over de volle breedte.

## User Stories
- Als lead wil ik op mijn telefoon een dag en tijd kiezen zonder in te zoomen of horizontaal te scrollen.
- Als lead wil ik mijn bedrijfsnaam en contactgegevens invullen en direct een bevestiging zien.
- Als admin wil ik op mijn telefoon geplande afspraken zien en blokken open- of dichtzetten.
- Als admin wil ik in de admin navigeren via een menu dat op mobiel inklapt.

## Component Tree

```
AfspraakView.vue                          [PAGE — views/]
├── SlotPicker.vue                        [ORGANISM — components/booking/]
│   ├── DayStrip.vue                      [MOLECULE]
│   │   └── DayChip.vue                   [ATOM — components/ui/]
│   └── SlotList.vue                      [MOLECULE]
│       └── SlotButton.vue                [ATOM — components/ui/]
├── BookingForm.vue                       [ORGANISM]
│   └── FormField.vue                     [ATOM — components/ui/]
└── BookingConfirmationCard.vue           [ORGANISM]

AdminLayout.vue                           [LAYOUT — layouts/]  (mobiele drawer)
├── AdminHeader.vue                       [ORGANISM — hamburger]
└── AdminSidebar.vue                      [ORGANISM — off-canvas < md]

AdminAfsprakenView.vue                    [PAGE — views/admin/]
├── BookingCard.vue                       [MOLECULE]
└── AvailabilityPlanner.vue               [ORGANISM]
    ├── AvailabilityLegend.vue            [MOLECULE]
    │   └── LegendDot.vue                 [ATOM — components/ui/]
    ├── AvailabilityDayList.vue           [ORGANISM]  (< lg)
    │   └── DayStrip.vue                  [MOLECULE]
    ├── AvailabilityWeekTable.vue         [MOLECULE]  (≥ lg)
    └── SaveBar.vue                       [MOLECULE]  (sticky onderaan)
```

## Components

| Component | Level | Props | Emits / Model | Slots |
|---|---|---|---|---|
| `SlotButton` | ATOM | `selected?`, `disabled?` | `click` | default (label) |
| `DayChip` | ATOM | `weekday`, `day`, `month`, `selected?`, `marked?` | `click` | — |
| `FormField` | ATOM | `id`, `label`, `type?`, `required?`, `invalid?`, `maxlength?`, `autocomplete?`, `inputmode?`, `placeholder?`, `rows?` (rows > 0 → textarea) | `v-model: string` | — |
| `LegendDot` | ATOM | `variant: open\|closed\|booked\|pending`, `label` | — | — |
| `DayStrip` | MOLECULE | `days: DayOption[]`, `label` | `v-model: string \| null` | — |
| `SlotList` | MOLECULE | `slots: {value,label}[]`, `label` | `v-model: string \| null` | — |
| `BookingCard` | MOLECULE | `booking: AdminBooking`, `when` | `viewLead` | — |
| `AvailabilityLegend` | MOLECULE | — | — | — |
| `SaveBar` | MOLECULE | `pendingCount`, `saving`, `saved` | `save`, `discard` | — |
| `AvailabilityWeekTable` | MOLECULE | `week`, `open`, `changed`, `booked` | `toggle(isos)` | — |
| `SlotPicker` | ORGANISM | `slots`, `loading`, `error`, `taken` | `v-model: string \| null`, `retry` | — |
| `BookingForm` | ORGANISM | `hasSlot`, `selectedLabel`, `submitting`, `submitError`, `initialNote?` | `submit(BookingFormValues)` | — |
| `BookingConfirmationCard` | ORGANISM | `confirmation`, `email` | — | — |
| `AvailabilityDayList` | ORGANISM | `week`, `open`, `changed`, `booked` | `toggle(isos)` | — |
| `AvailabilityPlanner` | ORGANISM | `grid`, `open`, `bookings`, `saving`, `saved` | `save(AvailabilityChange)` | — |

## Composables
- `useAvailabilityDraft()` (`src/composables/`) beheert de concept-set open blokken: `reset(open)`, `toggle(isos)`, `discard()`, `changed`, `diff` → `{ open, close }`. Pure state, geen API-calls, dus unit-testbaar.
- Bestaande API-composables (booking slots/submit, admin bookings/availability) blijven ongewijzigd.

## State
- **Lokaal in organisms:** gekozen dag (`SlotPicker`, `AvailabilityDayList`), formuliervelden (`BookingForm`), huidige week (`AvailabilityPlanner`).
- **Concept:** `useAvailabilityDraft` in `AvailabilityPlanner`; reset bij wijziging van de `open`-prop.
- **PAGE:** opgehaalde data, laad-/foutstatus, gekozen slot (`selectedSlot`).
- **Layout:** `sidebarOpen` in `AdminLayout`; sluit bij routewissel, Escape en tik op backdrop.

## Utilities (`src/utils/bookingGrid.ts`)
`amsterdamParts`, `mondayOf`, `buildWeeks`, `cellKey`, `formatDate`, `dayOption`, `groupByDay`, `dayCells`. Alles rekent in tijdzone Europe/Amsterdam (inclusief zomer-/wintertijd).

## Acceptance Criteria
- [x] No horizontal page scroll at 375px on `/afspraak` and `/admin/afspraken` (`scrollWidth === innerWidth`).
- [x] Every interactive element on mobile is ≥ 44px high, except inline text links.
- [x] Inputs use `text-base` on mobile, so iOS does not zoom in.
- [x] The availability week table is only visible from `lg` (≥ 1024px). Below that, the admin uses the DayList (DayStrip + rows).
- [x] Booked blocks cannot be clicked and show the company name.
- [x] "Open hele dag" opens every free, non-booked block of the chosen day.
- [x] Saving sends only the diff (`open` / `close`).
- [x] The admin sidebar is an off-canvas drawer below `md`, with a hamburger, a backdrop, Escape to close and auto-close on navigation.
- [x] The DayStrip scrolls horizontally inside its container (snap) without the page widening.
- [x] Choosing another day in the SlotPicker clears the chosen time.

## Tests
- `src/utils/bookingGrid.test.ts`: time zones, weeks, groupByDay, dayOption, dayCells
- `src/composables/useAvailabilityDraft.spec.ts`
- `src/components/booking/SlotPicker.spec.ts`
- `src/components/booking/BookingForm.spec.ts`
- `src/components/booking/AvailabilityPlanner.spec.ts`

## Implemented Files

| File | Atomic Level | Notes |
|---|---|---|
| `src/components/ui/SlotButton.vue` | ATOM | min-h-11 |
| `src/components/ui/DayChip.vue` | ATOM | snap-start, marked dot |
| `src/components/ui/FormField.vue` | ATOM | defineModel, text-base op mobiel |
| `src/components/ui/LegendDot.vue` | ATOM | |
| `src/components/booking/DayStrip.vue` | MOLECULE | overflow-x-auto + min-w-0 |
| `src/components/booking/SlotList.vue` | MOLECULE | grid 3→4 kolommen |
| `src/components/booking/BookingCard.vue` | MOLECULE | |
| `src/components/booking/AvailabilityLegend.vue` | MOLECULE | |
| `src/components/booking/SaveBar.vue` | MOLECULE | sticky bottom |
| `src/components/booking/AvailabilityWeekTable.vue` | MOLECULE | alleen lg+ |
| `src/components/booking/SlotPicker.vue` | ORGANISM | |
| `src/components/booking/BookingForm.vue` | ORGANISM | validatie + honeypot |
| `src/components/booking/BookingConfirmationCard.vue` | ORGANISM | |
| `src/components/booking/AvailabilityDayList.vue` | ORGANISM | < lg |
| `src/components/booking/AvailabilityPlanner.vue` | ORGANISM | |
| `src/composables/useAvailabilityDraft.ts` | COMPOSABLE | |
| `src/views/AfspraakView.vue` | PAGE | dun, data + analytics |
| `src/views/admin/AdminAfsprakenView.vue` | PAGE | dun |
| `src/layouts/AdminLayout.vue` | LAYOUT | drawer-state |
| `src/components/admin/AdminHeader.vue` | ORGANISM | hamburger |
| `src/components/admin/AdminSidebar.vue` | ORGANISM | off-canvas |

## Status
Implemented; awaiting validation by the Human Board.

## Last Updated
2026-10-20

## Changelog
- 2026-10-20: Mobile-first refactor using Atomic Design; admin layout made responsive (drawer).
