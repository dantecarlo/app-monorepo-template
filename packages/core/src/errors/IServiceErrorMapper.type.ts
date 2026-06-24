// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { ServiceErrorCodeType } from './serviceError.type'

export interface IServiceErrorMapper {
  mapError(params: { error: unknown }): ServiceErrorCodeType | null
}
