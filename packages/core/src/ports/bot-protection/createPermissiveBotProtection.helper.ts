// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { IBotProtectionPort } from './IBotProtectionPort.type'

export const createPermissiveBotProtection = (): IBotProtectionPort => ({
  verifyToken: async () => ({ success: true })
})
