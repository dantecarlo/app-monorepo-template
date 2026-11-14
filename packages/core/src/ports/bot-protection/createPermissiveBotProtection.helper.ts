import type { IBotProtectionPort } from '#src/ports/bot-protection/IBotProtectionPort.type'

export const createPermissiveBotProtection = (): IBotProtectionPort => ({
  verifyToken: async () => ({ success: true })
})
