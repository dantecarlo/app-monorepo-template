// The files posthog-react-native keeps its ids, its queue and its log
// records in when it persists on its own, as it does under `granted`: in the
// document directory on a native platform, and under the same names in the
// device's key-value storage in a web bundle. Under `opt-in` it persists
// through the consent storage, under other keys, so under `opt-in` these
// only ever hold what another mode left.
export const SDK_STORAGE_FILES = [
  '.posthog-rn.json',
  '.posthog-rn-logs.json'
]
