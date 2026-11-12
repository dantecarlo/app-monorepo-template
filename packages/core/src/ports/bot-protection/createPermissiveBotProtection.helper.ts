import type { IBotProtectionPort } from './IBotProtectionPort.type'

export const createPermissiveBotProtection = (): IBotProtectionPort => ({
  verifyToken: async () => ({ success: true })
})
