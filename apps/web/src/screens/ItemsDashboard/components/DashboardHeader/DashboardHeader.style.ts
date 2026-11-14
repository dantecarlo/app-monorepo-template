export const DASHBOARD_HEADER = {
  APP_BADGE: [
    'flex h-9 w-9 items-center justify-center rounded-md',
    'bg-accent-gradient shadow-accent-glow',
    'font-display text-heading font-extrabold text-accent-ink'
  ].join(' '),
  ROOT: 'flex items-center justify-between',
  SUBTITLE: 'font-body text-caption text-text-secondary',
  WORDMARK: 'flex items-center gap-3'
} as const
