// URL schemes a resolved Playwright baseURL may use. Relative page.goto calls
// only work against an absolute http(s) origin.
export const BASE_URL_PROTOCOLS = ['http:', 'https:'] as const
