# Tasks: scrub-and-query-key

- [x] T1 — `scrubPII` marks only a cycle as circular, arrays included · Requirements: CORE-23 · Commit: 02635b3
- [x] T2 — `sanitizeQueryKey` keeps only registered segments, both apps register theirs, and five skills and the map say so · Requirements: CORE-08, WEB-24, MOBILE-25 · Commit: 7fec107
- [ ] T3 — `scrubPII` walks each object once and reuses its scrubbed copy (independent verification, B1) · Requirements: CORE-23 · Commit: —
