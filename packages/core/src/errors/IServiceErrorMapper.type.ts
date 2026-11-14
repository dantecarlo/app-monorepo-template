import type { ServiceErrorCodeType } from '#src/errors/serviceError.type'

export interface IServiceErrorMapper {
  mapError(params: { error: unknown }): ServiceErrorCodeType | null
}
