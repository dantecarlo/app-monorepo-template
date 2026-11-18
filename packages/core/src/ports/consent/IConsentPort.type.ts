import type { ConsentStatusType } from '#src/ports/consent/consentStatus.type'

// The consent a banner asks for, as the app's provider records it. Every call
// is async: a provider may keep the choice in async storage.
export interface IConsentPort {
  getStatus(): Promise<ConsentStatusType>
  grant(): Promise<void>
  revoke(): Promise<void>
}
