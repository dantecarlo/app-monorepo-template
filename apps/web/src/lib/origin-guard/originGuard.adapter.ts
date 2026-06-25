import { createCloudflareOriginGuard } from '@app/cloudflare'
import type { IOriginGuardPort } from '@app/core'

export const originGuard: IOriginGuardPort = createCloudflareOriginGuard()
