import type { RequestHandler } from 'msw'

// Add MSW handlers here as the mobile app gains HTTP-backed services.
// Tests intercept requests via MSW rather than mocking fetch directly.
export const handlers: RequestHandler[] = []
