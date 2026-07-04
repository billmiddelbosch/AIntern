# Component Architecture — Confirmed Facts

## Vue's whitespace-condense compiler collapses (not strips) mixed text nodes
scope: all-projects

Vue 3's default template compiler whitespace handling (`whitespace: 'condense'`)
*collapses* runs of whitespace to a single space in text nodes that mix real
content with surrounding newline whitespace. Full removal only applies to
text nodes that are *purely* whitespace. A template like:

```vue
<p>
  {{ winPct }}%
</p>
```

renders as `"66% "` (trailing space preserved as a single collapsed space),
not `"66%"` — because the text node is `"\n  "` + `{{winPct}}` + `"%\n"`, and
the `"%\n"` segment mixes the literal `%` with trailing whitespace, so it
collapses to `"% "` rather than being stripped.

**Symptom**: string-equality assertions in tests fail with a mismatched
trailing space that isn't visible in normal rendering (whitespace is
invisible in browsers) but breaks `toHaveText()`/`toBe()` checks.

**Fix**: keep interpolation-adjacent static text (or the closing tag) on the
same line as the interpolation: `>{{ winPct }}%</p>`.

**Discovered in**: `src/components/poker/EquityResultBar.vue`, 2026-07-02.

## VueUse `useEventListener` needs an omitted (not explicit) target in vite-ssg/SSR projects
scope: all-projects

In a `vite-ssg`-based (or any Vue SSR) project, passing an explicit `window`
or `document` target argument to VueUse composables like `useEventListener`
throws `ReferenceError: window is not defined` during server-side rendering
— the bare identifier is evaluated as an argument expression *before*
VueUse's internal SSR-safe `defaultWindow` resolution logic ever runs.

**Fix**: omit the target argument entirely and let VueUse resolve it lazily:

```ts
// Throws during SSR:
useEventListener(window, 'keydown', handler)

// SSR-safe — resolves lazily via VueUse's defaultWindow:
useEventListener('keydown', handler)
```

**Discovered in**: `src/components/poker/CardPickerGrid.vue`, 2026-07-02
(global keyboard-shortcut listener for the card picker).
