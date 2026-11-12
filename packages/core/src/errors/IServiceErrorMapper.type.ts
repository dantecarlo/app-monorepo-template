import type { ServiceErrorCodeType } from './serviceError.type'

export interface IServiceErrorMapper {
  mapError(params: { error: unknown }): ServiceErrorCodeType | null
}
