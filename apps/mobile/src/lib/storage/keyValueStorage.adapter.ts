import type {
  IKeyValueStoragePort,
  IStorageItemParams,
  IStorageKeyParams
} from '@app/core'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * The device's key-value storage, AsyncStorage behind IKeyValueStoragePort,
 * and the only file of this app that imports it: every other module keeps
 * its values on the device through this one.
 */
export const keyValueStorage: IKeyValueStoragePort = {
  getItem: ({ key }: IStorageKeyParams): Promise<string | null> =>
    AsyncStorage.getItem(key),

  removeItem: ({ key }: IStorageKeyParams): Promise<void> =>
    AsyncStorage.removeItem(key),

  setItem: ({ key, value }: IStorageItemParams): Promise<void> =>
    AsyncStorage.setItem(key, value)
}
