// PostHog's `customStorage` contract, getItem and setItem, plus the consent
// that decides whether a value reaches the device.
export interface IPostHogConsentStorage {
  close(): Promise<void>
  getItem(key: string): Promise<string | null>
  isGranted(): Promise<boolean>
  open(): Promise<void>
  setItem(key: string, value: string): Promise<void>
}
