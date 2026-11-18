// The Sentry capability's part of the Next config: next.config.ts applies
// this file because it sits beside it, and /init deletes it with the
// capability. Source maps upload only when SENTRY_AUTH_TOKEN is set, at
// deploy time.
//
// It is one of the files the `@sentry/nextjs` entry of
// .agents/contracts/dependencies.json names as its seam, so
// local/dependency-seam lets it import the SDK.
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const withSentry = ({ config }: { config: NextConfig }): NextConfig =>
  withSentryConfig(config, {
    silent: true,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }
  })

export default withSentry
