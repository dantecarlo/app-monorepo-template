import {
  COOKIE_SEPARATOR,
  COOKIE_VALUE_SEPARATOR,
  EXPIRED_COOKIE_ATTRIBUTES,
  HOST_LABEL_SEPARATOR,
  SDK_CONSENT_PREFIX,
  SDK_PERSISTENCE_KEY_REPLACEMENTS,
  SDK_STORAGE_KEY_SUFFIX,
  SDK_STORAGE_PREFIX
} from '@/lib/posthog/sdkStorage.constant'

interface ISdkNames {
  consent: string
  prefixes: string[]
}

const namesOf = ({ key }: { key: string }): ISdkNames => {
  const persisted = SDK_PERSISTENCE_KEY_REPLACEMENTS.reduce(
    (name, [pattern, replacement]) => name.replace(pattern, replacement),
    key
  )
  return {
    consent: `${SDK_CONSENT_PREFIX}${key}`,
    prefixes: [...new Set([key, persisted])].map(
      (name) => `${SDK_STORAGE_PREFIX}${name}${SDK_STORAGE_KEY_SUFFIX}`
    )
  }
}

const isSdkName = ({
  name,
  names
}: {
  name: string
  names: ISdkNames
}): boolean =>
  name === names.consent ||
  names.prefixes.some((prefix) => name.startsWith(prefix))

const removeFromStorage = ({
  names,
  storage
}: {
  names: ISdkNames
  storage: Storage
}): void => {
  Object.keys(storage)
    .filter((name) => isSdkName({ name, names }))
    .forEach((name) => storage.removeItem(name))
}

// The domains a cookie of this page can sit on: the host alone, and the host
// and each parent domain of it.
const cookieDomainsOf = ({
  hostname
}: {
  hostname: string
}): (string | undefined)[] => {
  const labels = hostname.split(HOST_LABEL_SEPARATOR)
  return [
    undefined,
    ...labels.map((_, index) =>
      labels.slice(index).join(HOST_LABEL_SEPARATOR)
    )
  ]
}

const expireCookies = ({ names }: { names: ISdkNames }): void => {
  const cookieNames = document.cookie
    .split(COOKIE_SEPARATOR)
    .map((cookie) => cookie.split(COOKIE_VALUE_SEPARATOR)[0]?.trim() ?? '')
    .filter((name) => isSdkName({ name, names }))
  const domains = cookieDomainsOf({ hostname: window.location.hostname })
  cookieNames.forEach((name) =>
    domains.forEach((domain) => {
      const scope = domain ? `; domain=${domain}` : ''
      document.cookie = `${name}=; ${EXPIRED_COOKIE_ATTRIBUTES}${scope}`
    })
  )
}

// A browser that blocks site data throws on reading a storage: that one is
// left as it is, and the others are still cleared.
const attempt = ({ clear }: { clear: () => void }): void => {
  try {
    clear()
  } catch {
    // Blocked: it holds nothing the app could read either.
  }
}

/**
 * Removes every value posthog-js keeps in this browser for a project key:
 * the local and session storage keys and the cookies named after it, a
 * cookie on a parent domain included. Every other value stays.
 */
export const removeSdkStorage = ({ key }: { key: string }): void => {
  const names = namesOf({ key })
  attempt({
    clear: () => removeFromStorage({ names, storage: window.localStorage })
  })
  attempt({
    clear: () =>
      removeFromStorage({ names, storage: window.sessionStorage })
  })
  attempt({ clear: () => expireCookies({ names }) })
}
