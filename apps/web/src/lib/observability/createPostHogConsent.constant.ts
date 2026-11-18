import type {
  IPostHogOptInOptions,
  IPostHogResetOptions
} from '@/lib/posthog/posthogClient.type'

// A grant sends no `$opt_in` event: the consent itself is not captured.
export const POSTHOG_OPT_IN_OPTIONS: IPostHogOptInOptions = {
  captureEventName: false
}

// A revoke also takes a new device id, so a later grant starts a new person.
export const POSTHOG_REVOKE_RESET_OPTIONS: IPostHogResetOptions = {
  resetDeviceID: true
}
