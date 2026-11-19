// posthog-react-native cannot load under the test environment: it imports
// React Native's Flow sources. vitest.config.ts aliases the package to this
// stand-in, so every module that imports it loads, and no request leaves.
//
// The methods are the calls the app makes (IPostHogClient), on the
// prototype: a test that watches one spies on `PostHog.prototype`, taken
// from the same module registry as the code it loads. A test that records
// how the client is constructed replaces the package with `vi.mock`.

export class PostHog {
  addExceptionStep(): void {
    return undefined
  }

  captureException(): void {
    return undefined
  }

  captureLog(): void {
    return undefined
  }

  identify(): void {
    return undefined
  }

  optIn(): Promise<void> {
    return Promise.resolve()
  }

  optOut(): Promise<void> {
    return Promise.resolve()
  }

  reset(): void {
    return undefined
  }
}
