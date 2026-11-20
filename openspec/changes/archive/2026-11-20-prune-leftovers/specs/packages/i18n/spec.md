# Delta: packages/i18n

> **Change:** `2026-11-20-prune-leftovers`

## MODIFIED Requirements

<!-- region web-next -->
### Requirement: I18N-11 — The catalogs carry a message per sign-in failure

The i18n package SHALL define, in every catalog, one message for each sign-in failure the web
app names: auth.error.emailNotConfirmed, auth.error.invalidCredentials,
auth.error.notConfigured and auth.error.rateLimited.

**Evidence:** written at archive, from the code.

#### Scenario: a rejected sign-in reaches the user

- **GIVEN** the message key of each sign-in failure the web app names
- **WHEN** every catalog is searched for it
- **THEN** each catalog holds a value for every key
- **Test:** `apps/web/src/lib/auth/__tests__/authGateway.constant.test.ts` › "names a message every catalog holds for each sign-in failure"
<!-- endregion web-next -->
