import type {
  IPostHogFlagsConfig,
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

// A revoke pauses the flags before its reset, which would otherwise request
// them for the new anonymous id, one /flags request after the refusal.
export const POSTHOG_FLAGS_PAUSED: IPostHogFlagsConfig = {
  advanced_disable_flags: true
}

// A grant after a revoke resumes them, and reloads them once.
export const POSTHOG_FLAGS_RESUMED: IPostHogFlagsConfig = {
  advanced_disable_flags: false
}
