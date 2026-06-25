const noop = () => undefined

export const init = noop
export const captureException = noop
export const captureMessage = noop
export const setUser = noop
export const addBreadcrumb = noop
export const wrap = <T>(component: T): T => component
