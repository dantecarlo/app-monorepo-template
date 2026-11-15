# Tasks: package-followups

- [ ] T1 — One `signImageUrl` signs for both adapters, and their exact signed URLs are pinned · Requirements: CLOUDFLARE-15, CLOUDFLARE-18 · Commit: —
- [ ] T2 — `isConstantTimeEqual` holds the origin guard's full-length comparison · Requirements: CLOUDFLARE-06 · Commit: —
- [ ] T3 — `verifySignedImageUrl` verifies a signed URL, the entry point exports it, and `docs/images.md` says where it runs · Requirements: CLOUDFLARE-20, CLOUDFLARE-01 · Commit: —
- [ ] T4 — Cloudflare Images returns the public delivery URL when it cannot sign · Requirements: CLOUDFLARE-16 · Commit: —
- [ ] T5 — The Turnstile fetch-failure test says what it asserts · Requirements: CLOUDFLARE-12 · Commit: —
- [ ] T6 — The `signalProcessTree` declaration and JSDoc name the POSIX condition · Requirements: TOOLING-12 · Commit: —
- [ ] T7 — The `scrubPII` contract says its result shares copies and what bounds a serializer · Requirements: CORE-23 · Commit: —
