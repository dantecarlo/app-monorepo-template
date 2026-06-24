export type {
  AppErrorCodeType,
  IAppErrorParams
} from './errors/AppError.helper'
export { APP_ERROR_CODES, AppError } from './errors/AppError.helper'
export type { IBuildServiceErrorParams } from './errors/buildServiceError.helper'
export { buildServiceError } from './errors/buildServiceError.helper'
export type { IServiceErrorMapper } from './errors/IServiceErrorMapper.type'
export type { ServiceErrorCodeType } from './errors/serviceError.type'
export {
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from './errors/serviceError.type'
export type { ISanitizeQueryKeyParams } from './observability/sanitizeQueryKey.helper'
export {
  REDACTED_SEGMENT,
  sanitizeQueryKey
} from './observability/sanitizeQueryKey.helper'
export type {
  IAuthGateway,
  IAuthSession,
  IAuthSubscription,
  IAuthUser,
  IOnAuthStateChangeParams,
  ISignInWithPasswordParams
} from './ports/auth/IAuthGateway.type'
export type {
  IBackendClientProvider,
  ICreateBackendClientParams
} from './ports/client/IBackendClientProvider.type'
export { PII_KEYS, scrubPII } from './utils/scrubPII.helper'
