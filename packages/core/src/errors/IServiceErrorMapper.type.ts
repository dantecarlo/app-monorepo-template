import type { ServiceErrorCodeType } from '@/../packages/core/src/errors/buildServiceError.helper'

export interface IServiceErrorMapper {
  mapError(params: { error: unknown }): ServiceErrorCodeType | null
}
