import type { Route } from 'next'

/**
 * A path the app navigates to: one of its routes, with or without a query
 * or a fragment, or an absolute URL. The typed routes of next.config.ts
 * check it against the route tree.
 */
export type AppRouteType = Route

/** The navigation a client block runs, under the app's own type. */
export interface IAppRouter {
  /** Navigates to the route, adding a history entry. */
  push: (href: AppRouteType) => void
  /** Renders the current route again on the server; client state stays. */
  refresh: () => void
  /** Navigates to the route, replacing the current history entry. */
  replace: (href: AppRouteType) => void
}
