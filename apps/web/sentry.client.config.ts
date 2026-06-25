import { scrubPII } from '@app/core'
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  beforeBreadcrumb: (breadcrumb) => scrubPII(breadcrumb),
  beforeSend: (event) => scrubPII(event),
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'development'
})
