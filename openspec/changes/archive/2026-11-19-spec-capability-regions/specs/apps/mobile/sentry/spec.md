# Delta: apps/mobile/sentry

> **Change:** `2026-11-19-spec-capability-regions`

Every requirement of this spec moves into the apps/mobile spec, inside its `sentry` region, so
the spec is removed with its `MOBILESENTRY` prefix.

## REMOVED Requirements

### Requirement: MOBILESENTRY-01 — PII scrubbed before Sentry

**Reason:** the Sentry part of the mobile app stays in the apps/mobile spec, inside a region the
`sentry` capability owns; the requirement is MOBILE-80 there.

### Requirement: MOBILESENTRY-02 — Sentry off without a DSN

**Reason:** the Sentry part of the mobile app stays in the apps/mobile spec, inside a region the
`sentry` capability owns; the requirement is MOBILE-81 there.

### Requirement: MOBILESENTRY-03 — The Sentry adapter keeps the port contract

**Reason:** the Sentry part of the mobile app stays in the apps/mobile spec, inside a region the
`sentry` capability owns; the requirement is MOBILE-82 there.
