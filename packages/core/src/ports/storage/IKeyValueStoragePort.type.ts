export interface IStorageKeyParams {
  key: string
}

export interface IStorageItemParams {
  key: string
  value: string
}

// A key-value store that outlives the process: the device's storage on
// mobile. Every call is async, as the device's storage is.
export interface IKeyValueStoragePort {
  getItem(params: IStorageKeyParams): Promise<string | null>
  removeItem(params: IStorageKeyParams): Promise<void>
  setItem(params: IStorageItemParams): Promise<void>
}
