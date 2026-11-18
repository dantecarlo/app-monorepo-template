import {
  GRANT_RECORD_KEY,
  GRANT_RECORD_VALUE
} from '@/lib/posthog/grantRecord.constant'

// Local storage throws when the browser blocks site data: the grant then
// reads as absent and is not kept.
const withStorage = <TResult>({
  access,
  fallback
}: {
  access: (storage: Storage) => TResult
  fallback: TResult
}): TResult => {
  try {
    return access(window.localStorage)
  } catch {
    return fallback
  }
}

/** Whether this browser holds a grant the consent API recorded. */
export const hasGrantRecord = (): boolean =>
  withStorage({
    access: (storage) =>
      storage.getItem(GRANT_RECORD_KEY) === GRANT_RECORD_VALUE,
    fallback: false
  })

/** Records a grant for the next visit. */
export const writeGrantRecord = (): void =>
  withStorage({
    access: (storage) =>
      storage.setItem(GRANT_RECORD_KEY, GRANT_RECORD_VALUE),
    fallback: undefined
  })

/** Removes the recorded grant. */
export const removeGrantRecord = (): void =>
  withStorage({
    access: (storage) => storage.removeItem(GRANT_RECORD_KEY),
    fallback: undefined
  })
