// posthog-react-native cannot load under the test environment: it imports
// React Native's Flow sources. vitest.config.ts aliases the package to this
// stand-in, so every module that imports it loads, and no request leaves.
//
// The methods are the calls the app makes, on the prototype: those of
// IPostHogClient, and the two a revoke makes when it stops the client. A
// test that watches one spies on `PostHog.prototype`, taken from the same
// module registry as the code it loads. A test that records how the client
// is constructed replaces the package with `vi.mock`.

// The persisted properties the app names: the queues a revoke empties, under
// the names the SDK gives them.
export const PostHogPersistedProperty = {
  AiCaptureQueue: 'ai_capture_queue',
  AiQueue: 'ai_queue',
  LogsQueue: 'logs_queue',
  Queue: 'queue'
} as const

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

  setPersistedProperty(): void {
    return undefined
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}
