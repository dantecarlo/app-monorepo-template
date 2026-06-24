---
name: perf
description: >
  React performance review for a component or hook: unnecessary re-renders, missing or
  misused memoization, unstable references, async anti-patterns (prefer useAppQuery over
  useEffect-fetch), bundle cost, list keys, lazy initialization. Arrow-only, no-semi
  snippets. Report-only with severity ratings.
  USE WHEN: "perf review", "performance review", "check re-renders", "optimize component",
  "component renders too often", "why is [X] slow", "audit performance of [name]".
---

# React Performance Review

> Read the component and its hook before starting. Profile first when possible.
> Premature optimization is the root of all evil — only optimize measurable problems.

---

## Pre-flight

1. Read the component file and its hook file (if it exists).
2. Open React DevTools Profiler and record a meaningful interaction if possible.
3. Identify which categories below apply to the target.

---

## 5 Categories of Performance Issues

### Category 1 — Unnecessary Re-renders

**Issue: Component re-renders when parent re-renders, even if props are unchanged**

```typescript
// ❌ Re-renders on every parent render even if items hasn't changed
export const ItemList = ({ items }: IItemList) => { ... }

// ✅ Memoize when the component is expensive AND props are stable
import { memo } from 'react'
export const ItemList = memo(({ items }: IItemList) => { ... })
```

Add `memo` only when:
- Component renders a long list, complex chart, or heavy computation
- Parent re-renders frequently (e.g. on every keystroke)
- Profiler confirms the render is expensive

Do NOT add `memo` to simple presentational components — the overhead can exceed
the render cost.

---

**Issue: Unstable object/array/function references as props**

```typescript
// ❌ New array literal on every render — memo is useless
<ItemList items={items.filter((i) => i.isActive)} />

// ✅ Stabilize with useMemo
const activeItems = useMemo(
  () => items.filter((i) => i.isActive),
  [items]
)
<ItemList items={activeItems} />
```

```typescript
// ❌ New function on every render
<Button onClick={() => handlePress(id)} />

// ✅ Stabilize with useCallback
const handlePressId = useCallback(
  () => handlePress(id),
  [handlePress, id]
)
<Button onClick={handlePressId} />
```

Memoize only when the consumer is also memoized — otherwise there is no benefit.

---

**Issue: Expensive computation on every render**

```typescript
// ❌ Re-computed on every render
const sorted = items.sort((a, b) => a.label.localeCompare(b.label))

// ✅ Memoized
const sorted = useMemo(
  () => [...items].sort((a, b) => a.label.localeCompare(b.label)),
  [items]
)
```

---

### Category 2 — Async Anti-patterns

**Issue: `useEffect` for data fetching**

```typescript
// ❌ Race condition, no caching, no deduplication, no error handling
useEffect(() => {
  fetch('/api/items').then((r) => r.json()).then(setItems)
}, [])

// ✅ TanStack Query handles all of the above
const { data: items } = useAppQuery({ queryOptions: { ... } })
```

Use `useAppQuery` from `@/lib/query` — it wraps `useQuery` with error toasts
and project-level defaults.

---

**Issue: `useEffect` syncing prop to state**

```typescript
// ❌ Derived state via useEffect — double render + stale state bugs
useEffect(() => {
  setCount(propCount)
}, [propCount])

// ✅ Derive directly
const count = propCount

// ✅ Or useMemo if transformation is needed
const doubled = useMemo(() => propCount * 2, [propCount])
```

---

**Issue: Missing cleanup in useEffect**

```typescript
// ❌ Subscription leaks
useEffect(() => {
  const sub = emitter.subscribe(handler)
  // missing cleanup!
}, [])

// ✅
useEffect(() => {
  const sub = emitter.subscribe(handler)
  return () => sub.unsubscribe()
}, [])
```

---

### Category 3 — Bundle Optimization

**Issue: Importing entire library when only one function is needed**

```typescript
// ❌ Imports entire lodash
import _ from 'lodash'
const debounced = _.debounce(fn, DEBOUNCE_DELAY_MS)

// ✅ Tree-shakeable import
import { debounce } from 'lodash-es'
// or use a useDebouncedCallback hook
```

**Issue: Heavy component loaded eagerly**

```typescript
// ❌ Loads even when not rendered
import { HeavyChart } from '@/components/HeavyChart'

// ✅ Lazy load
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() =>
  import('@/components/HeavyChart/HeavyChart.component').then(
    (m) => ({ default: m.HeavyChart })
  )
)
// Wrap usage in <Suspense fallback={<LoadingState />}>
```

---

### Category 4 — Rendering Performance

**Issue: Key on index instead of stable ID**

```typescript
// ❌ Causes full re-render of all items on reorder/insert
{items.map((item, i) => <ItemRow item={item} key={i} />)}

// ✅ Stable entity ID
{items.map((item) => <ItemRow item={item} key={item.id} />)}
```

**Issue: Large unvirtualized lists**

For lists over ~100 items, consider virtualization (`@tanstack/react-virtual`
or equivalent). Report as WARNING when the list is fetched without a size limit.

**Issue: Lazy state initialization skipped**

```typescript
// ❌ createInitial() runs on every render (only first result is used)
const [state, setState] = useState(createInitial())

// ✅ Lazy initializer — runs only on mount
const [state, setState] = useState(createInitial)
```

---

### Category 5 — JavaScript Micro-optimizations

Only flag these when profiling confirms they are bottlenecks.

**Object spread in hot paths**:

```typescript
// ❌ Creates a new object on every call in a frequently-invoked function
return { ...defaults, ...overrides }

// ✅ (only if profiling confirms it matters)
// Object.assign(target, overrides) — mutates in place, use only when safe
```

**Chained array operations on large arrays**:

```typescript
// ❌ Two passes through the array
const filtered = items.filter(predicate)
const result = filtered.map(transform)

// ✅ One pass (measure first — readability may not be worth it)
const result = items.reduce<IItem[]>((acc, item) => {
  if (predicate(item)) acc.push(transform(item))
  return acc
}, [])
```

---

## Report Format

```
# Performance Review — {component or file}

## Critical (measurable impact)
- [CRITICAL] {file}:{line} — {issue}
  Fix: {specific fix with code snippet}

## Warning (likely impact under load)
- [WARNING] {file}:{line} — {issue}
  Fix: {specific fix}

## Suggestion (minor or speculative)
- [SUGGESTION] {file}:{line} — {observation}
  Consider: {option}

## No Action Needed
- {observation} — intentional or not impactful enough to change
```

---

## DO vs DON'T

| DO                                                | DON'T                                         |
| ------------------------------------------------- | --------------------------------------------- |
| Profile before memoizing                          | Wrap every component in `memo` defensively    |
| Memoize when props are stable AND child is expensive | Memoize when deps change on every render   |
| Use `useAppQuery` for async data                  | Use `useEffect` + `useState` for data fetching |
| Lazy-load routes and heavy features               | Eagerly import everything at the top level    |
| Stable entity IDs as list keys                    | Array index as key                            |
| Measure with React DevTools Profiler              | Optimize by intuition alone                   |
