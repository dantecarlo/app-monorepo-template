# Delta: apps/web/sentry

> **Change:** `2026-11-19-spec-capability-regions`

Every requirement of this spec moves into the apps/web spec, inside its `sentry` region, so the
spec is removed with its `WEBSENTRY` prefix.

## REMOVED Requirements

### Requirement: WEBSENTRY-01 — The Sentry adapter scrubs PII and stays silent without a DSN

**Reason:** the Sentry part of the web app stays in the apps/web spec, inside a region the
`sentry` capability owns; the requirement is WEB-81 there.

### Requirement: WEBSENTRY-02 — The Sentry SDK scrubs every event in every runtime

**Reason:** the Sentry part of the web app stays in the apps/web spec, inside a region the
`sentry` capability owns; the requirement is WEB-82 there.

### Requirement: WEBSENTRY-03 — The Sentry capability's file wraps the Next config

**Reason:** the Sentry part of the web app stays in the apps/web spec, inside a region the
`sentry` capability owns; the requirement is WEB-83 there.

### Requirement: WEBSENTRY-04 — The Sentry adapter keeps the port contract

**Reason:** the Sentry part of the web app stays in the apps/web spec, inside a region the
`sentry` capability owns; the requirement is WEB-84 there.
