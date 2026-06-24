import type { ServiceErrorCodeType } from '@/errors/serviceError.type'

export interface IServiceErrorMapper {
  mapError(params: { error: unknown }): ServiceErrorCodeType | null
}
