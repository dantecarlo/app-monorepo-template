export type { IAppErrorParams } from './errors/AppError.helper'
export { AppError } from './errors/AppError.helper'
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
export { createPermissiveBotProtection } from './ports/bot-protection/createPermissiveBotProtection.helper'
export type {
  IBotProtectionPort,
  IBotVerificationResult,
  IVerifyTokenParams
} from './ports/bot-protection/IBotProtectionPort.type'
export type {
  IBackendClientProvider,
  ICreateBackendClientParams
} from './ports/client/IBackendClientProvider.type'
export type { ICreatePublicImageDeliveryParams } from './ports/image-delivery/createPublicImageDelivery.helper'
export { createPublicImageDelivery } from './ports/image-delivery/createPublicImageDelivery.helper'
export type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from './ports/image-delivery/IImageDeliveryPort.type'
export { createConsoleObservability } from './ports/observability/createConsoleObservability.helper'
export { createNoopObservability } from './ports/observability/createNoopObservability.helper'
export type {
  IAddBreadcrumbParams,
  ICaptureErrorParams,
  ICaptureMessageParams,
  IObservabilityPort,
  IObservabilityUser,
  ISetUserParams
} from './ports/observability/IObservabilityPort.type'
export type { ObservabilityLevelType } from './ports/observability/observabilityLevel.type'
export { ObservabilityLevelEnum } from './ports/observability/observabilityLevel.type'
export { createPassthroughOriginGuard } from './ports/origin-guard/createPassthroughOriginGuard.helper'
export type {
  IAssertTrustedOriginParams,
  IHeaderReader,
  IOriginGuardPort,
  IOriginGuardResult
} from './ports/origin-guard/IOriginGuardPort.type'
export type { OriginGuardReasonType } from './ports/origin-guard/originGuardReason.type'
export { OriginGuardReasonEnum } from './ports/origin-guard/originGuardReason.type'
export { PII_KEYS, scrubPII } from './utils/scrubPII.helper'
