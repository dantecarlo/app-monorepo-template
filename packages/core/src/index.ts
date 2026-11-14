export type { IAppErrorParams } from '#src/errors/AppError.helper'
export { AppError } from '#src/errors/AppError.helper'
export type { IBuildServiceErrorParams } from '#src/errors/buildServiceError.helper'
export { buildServiceError } from '#src/errors/buildServiceError.helper'
export type { IServiceErrorMapper } from '#src/errors/IServiceErrorMapper.type'
export type { ServiceErrorCodeType } from '#src/errors/serviceError.type'
export {
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '#src/errors/serviceError.type'
export type { ISanitizeQueryKeyParams } from '#src/observability/sanitizeQueryKey.helper'
export {
  REDACTED_SEGMENT,
  sanitizeQueryKey
} from '#src/observability/sanitizeQueryKey.helper'
export type {
  IAuthGateway,
  IAuthSession,
  IAuthSubscription,
  IAuthUser,
  IOnAuthStateChangeParams,
  ISignInWithPasswordParams
} from '#src/ports/auth/IAuthGateway.type'
export { createPermissiveBotProtection } from '#src/ports/bot-protection/createPermissiveBotProtection.helper'
export type {
  IBotProtectionPort,
  IBotVerificationResult,
  IVerifyTokenParams
} from '#src/ports/bot-protection/IBotProtectionPort.type'
export type {
  IBackendClientProvider,
  ICreateBackendClientParams
} from '#src/ports/client/IBackendClientProvider.type'
export type { ICreatePublicImageDeliveryParams } from '#src/ports/image-delivery/createPublicImageDelivery.helper'
export { createPublicImageDelivery } from '#src/ports/image-delivery/createPublicImageDelivery.helper'
export type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from '#src/ports/image-delivery/IImageDeliveryPort.type'
export { createConsoleObservability } from '#src/ports/observability/createConsoleObservability.helper'
export { createNoopObservability } from '#src/ports/observability/createNoopObservability.helper'
export type {
  IAddBreadcrumbParams,
  ICaptureErrorParams,
  ICaptureMessageParams,
  IObservabilityPort,
  IObservabilityUser,
  ISetUserParams
} from '#src/ports/observability/IObservabilityPort.type'
export type { ObservabilityLevelType } from '#src/ports/observability/observabilityLevel.type'
export { ObservabilityLevelEnum } from '#src/ports/observability/observabilityLevel.type'
export { createPassthroughOriginGuard } from '#src/ports/origin-guard/createPassthroughOriginGuard.helper'
export type {
  IAssertTrustedOriginParams,
  IHeaderReader,
  IOriginGuardPort,
  IOriginGuardResult
} from '#src/ports/origin-guard/IOriginGuardPort.type'
export type { OriginGuardReasonType } from '#src/ports/origin-guard/originGuardReason.type'
export { OriginGuardReasonEnum } from '#src/ports/origin-guard/originGuardReason.type'
export { PII_KEYS, scrubPII } from '#src/utils/scrubPII.helper'
