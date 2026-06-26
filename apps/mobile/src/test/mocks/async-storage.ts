// Test mock for @react-native-async-storage/async-storage. The real package is
// a native module unavailable under the vitest happy-dom environment; tests
// only need an in-memory key/value surface.

const store = new Map<string, string>()

const AsyncStorageMock = {
  clear: async () => {
    store.clear()
  },
  getItem: async (key: string) => store.get(key) ?? null,
  removeItem: async (key: string) => {
    store.delete(key)
  },
  setItem: async (key: string, value: string) => {
    store.set(key, value)
  }
}

export default AsyncStorageMock
