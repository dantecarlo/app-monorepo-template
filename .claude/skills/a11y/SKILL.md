---
name: a11y
description: >
  WCAG 2.1 AA accessibility audit for a component, screen, or scope. Four categories:
  semantic HTML and ARIA, keyboard navigation, visual and content, interactive element
  labeling. Focus-ring examples use token-driven UI (var(--color-...) / @app/tokens)
  instead of hardcoded colors. Report-only: severity-tagged findings with WCAG reference
  and fix guidance. Run vitest-axe for automated checks first (~30%), then manual walk
  through all 4 categories. This skill is consumed by validate-all's G-a11y-design-dod group.
  USE WHEN: "a11y audit", "accessibility review", "check accessibility for [X]",
  "WCAG compliance", "screen reader support", "is [component] accessible?".
---

# Accessibility Review (WCAG 2.1 AA)

> Goal: meet WCAG 2.1 AA minimum. Run `vitest-axe` for automated checks (~30% of
> issues); walk through the 4 categories below for the remaining 70%.
>
> This skill is the reusable a11y reference consumed by `validate-all`'s
> G-a11y-design-dod group. Run `validate-all` for the full post-generation harness.

---

## Pre-flight

1. Read the component or screen file completely.
2. Run `vitest-axe` (`axe(container)`) if a test exists — automated catches ~30%.
3. Walk through the 4 categories below manually for the remaining 70%.

---

## Category 1 — Semantic HTML and ARIA

### Rule 1.1 — Semantic HTML over `<div>` + ARIA

```tsx
// ❌ ARIA role bolted onto a div
<div role="button" onClick={handleSubmit}>Submit</div>

// ✅ Semantic element (keyboard, focus, and role are free)
<button type="button" onClick={handleSubmit}>Submit</button>
```

Semantic elements to prefer: `<button>`, `<a href>`, `<nav>`, `<main>`,
`<header>`, `<footer>`, `<section aria-label>`, `<article>`, `<ul>/<li>`,
`<h1>–<h6>`, `<form>`, `<input>`, `<label>`.

### Rule 1.2 — Correct ARIA Roles and Attributes

```tsx
// ❌ aria-expanded on an element that doesn't control a region
<button aria-expanded="true">Menu</button>

// ✅ aria-expanded only when the button controls an open/closed region
<button aria-controls="nav-menu" aria-expanded={isOpen}>Menu</button>
<nav hidden={!isOpen} id="nav-menu">...</nav>
```

Common ARIA patterns:
- `aria-label` — names an element with no visible text
- `aria-labelledby` — points to an element that names this one
- `aria-describedby` — supplemental description
- `aria-expanded` — open/closed state for disclosure widgets
- `aria-haspopup` — indicates a popup (menu, dialog, listbox)
- `aria-live` — announces dynamic content to screen readers
- `role="status"` / `role="alert"` — polite / assertive announcements

### Rule 1.3 — Heading Hierarchy

```tsx
// ❌ Jumps from h1 to h4 (skips levels)
<h1>Page Title</h1>
<h4>Section</h4>

// ✅ Sequential hierarchy
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### Rule 1.4 — Form Inputs Have Associated Labels

```tsx
// ❌ No label association
<input placeholder="Email" type="email" />

// ✅ Explicit label association
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// ✅ Or visually hidden label
<label className="sr-only" htmlFor="search">Search</label>
<input id="search" type="search" />
```

---

## Category 2 — Keyboard Navigation

### Rule 2.1 — All Interactive Elements Are Focusable

```tsx
// ❌ Non-interactive element — not focusable, no keyboard handler
<span onClick={handleAction}>Click me</span>

// ✅ Semantic button
<button type="button" onClick={handleAction}>Click me</button>

// ✅ If truly must be a div (rare)
<div
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleAction()
  }}
  role="button"
  tabIndex={0}
>
  Click me
</div>
```

### Rule 2.2 — Focus Order Follows Visual/Logical Order

Tab sequence should match reading order. If CSS `order` or `position: absolute`
changes visual order, restructure the DOM or use `tabIndex` carefully.

### Rule 2.3 — Focus Is Not Trapped (Except in a Modal)

Modals and dialogs MUST trap focus while open:
- Tab cycles through focusable elements inside the dialog
- Shift+Tab cycles backward
- Escape closes and returns focus to the trigger element

### Rule 2.4 — Visible Focus Indicator

```css
/* ❌ Never remove outlines globally */
* { outline: none; }

/* ✅ Custom focus ring using design tokens */
button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Use `var(--color-...)` from `@app/tokens` — never hardcoded hex values.

---

## Category 3 — Visual and Content

### Rule 3.1 — Color Contrast (WCAG AA)

- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ bold or 24px+ normal): minimum 3:1
- Interactive element borders: minimum 3:1

Use browser DevTools contrast checker or automated `axe` scan.

### Rule 3.2 — Information Not Conveyed by Color Alone

```tsx
// ❌ Only color distinguishes error
<input className={hasError ? 'border-red-500' : 'border-gray-300'} />

// ✅ Color + icon + text + aria attributes
<input
  aria-describedby={hasError ? 'error-msg' : undefined}
  aria-invalid={hasError}
  className={hasError ? 'border-red-500' : 'border-gray-300'}
/>
{hasError && (
  <p id="error-msg" className="text-red-500">
    <span aria-hidden="true">⚠ </span>
    This field is required.
  </p>
)}
```

### Rule 3.3 — Images Have Alt Text

```tsx
// ❌ No alt
<img src="avatar.jpg" />

// ✅ Descriptive alt for meaningful images
<img alt="User profile picture" src="avatar.jpg" />

// ✅ Empty alt for decorative images (screen reader skips it)
<img alt="" src="decorative-swoosh.svg" />
```

### Rule 3.4 — Avoid Auto-Playing Media

Videos/audio that auto-play must have a visible pause control within 3 seconds.
All video content should have captions or a transcript.

---

## Category 4 — Interactive Element Labeling

### Rule 4.1 — Icon-Only Buttons Have `aria-label`

```tsx
// ❌ No accessible name
<button onClick={onClose}><XIcon /></button>

// ✅
<button aria-label="Close dialog" onClick={onClose}><XIcon /></button>
```

### Rule 4.2 — Icon + Text Buttons Do Not Need Extra `aria-label`

```tsx
// ✅ Text label is sufficient
<button onClick={onSave}>
  <SaveIcon aria-hidden="true" />
  Save
</button>
```

Mark the icon `aria-hidden="true"` so screen readers don't announce it separately.

### Rule 4.3 — Dynamic Status Announcements Use `aria-live`

```tsx
// ✅ Announce loading / success / error state to screen readers
<div aria-atomic="true" aria-live="polite">
  {isLoading && 'Loading…'}
  {isSuccess && 'Saved successfully.'}
  {isError && 'Error saving. Please try again.'}
</div>
```

---

## Report Format

```
# Accessibility Audit — {scope}

## Critical (WCAG AA failure)
- [CRITICAL] {file}:{line} — {issue}
  WCAG: {criterion}
  Fix: {specific fix}

## Serious (impacts many users)
- [SERIOUS] {file}:{line} — {issue}
  Fix: {fix}

## Moderate (impacts some users or assistive tech)
- [MODERATE] {file}:{line} — {issue}
  Fix: {fix}

## Passed
- Heading hierarchy: ✅
- Form labels: ✅
- ...
```
