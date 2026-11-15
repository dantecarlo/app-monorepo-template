# Tasks: package-followups

- [x] T1 — One `signImageUrl` signs for both adapters, and their exact signed URLs are pinned · Requirements: CLOUDFLARE-15, CLOUDFLARE-18 · Commit: 0efc635
- [x] T2 — `isConstantTimeEqual` holds the origin guard's full-length comparison · Requirements: CLOUDFLARE-06 · Commit: 8f65173
- [x] T3 — `verifySignedImageUrl` verifies a signed URL, the entry point exports it, and `docs/images.md` says where it runs · Requirements: CLOUDFLARE-20, CLOUDFLARE-01 · Commit: 07d5251
- [x] T4 — Cloudflare Images returns the public delivery URL when it cannot sign · Requirements: CLOUDFLARE-16 · Commit: 908030c
- [x] T5 — The Turnstile fetch-failure test says what it asserts · Requirements: CLOUDFLARE-12 · Commit: 9f9e439
- [x] T6 — The `signalProcessTree` declaration and JSDoc name the POSIX condition · Requirements: TOOLING-12 · Commit: a170fcf
- [x] T7 — The `scrubPII` contract says its result shares copies and what bounds a serializer · Requirements: CORE-23 · Commit: bcd0ffa
- [x] T8 — `verifySignedImageUrl` builds under the `noUncheckedIndexedAccess` of apps/web, whose build failed on it at the first `pnpm validate` · Requirements: CLOUDFLARE-20 · Commit: a4334a6
