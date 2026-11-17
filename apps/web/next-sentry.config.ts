// The Sentry capability's part of the Next config: next.config.ts applies
// this file because it sits beside it, and /init deletes it with the
// capability. Source maps upload only when SENTRY_AUTH_TOKEN is set, at
// deploy time.
//
// A build-time config of the framework, the same kind as next.config.ts and
// the sentry.*.config.ts files the vendor-SDK override of eslint.rules.mjs
// lists; that list predates this file.
// eslint-disable-next-line no-restricted-imports -- framework config entry point, like next.config.ts
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const withSentry = ({ config }: { config: NextConfig }): NextConfig =>
  withSentryConfig(config, {
    silent: true,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }
  })

export default withSentry
