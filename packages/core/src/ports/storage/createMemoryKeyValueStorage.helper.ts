import type {
  IKeyValueStoragePort,
  IStorageItemParams,
  IStorageKeyParams
} from '#src/ports/storage/IKeyValueStoragePort.type'

/**
 * A key-value storage held in memory: vendor-free, gone with the process.
 * Each call creates a storage of its own.
 */
export const createMemoryKeyValueStorage = (): IKeyValueStoragePort => {
  const items = new Map<string, string>()

  return {
    getItem: async ({ key }: IStorageKeyParams): Promise<string | null> =>
      items.get(key) ?? null,

    removeItem: async ({ key }: IStorageKeyParams): Promise<void> => {
      items.delete(key)
    },

    setItem: async ({ key, value }: IStorageItemParams): Promise<void> => {
      items.set(key, value)
    }
  }
}
