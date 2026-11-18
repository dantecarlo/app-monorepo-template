/**
 * The entries of an options object whose value is defined. An option a
 * caller leaves out must not reach the query library as `undefined`: that
 * would override the client's default for it (its stale time, its retries).
 */
export const omitUndefined = <TValues extends object>(
  values: TValues
): Partial<TValues> =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  ) as Partial<TValues>
