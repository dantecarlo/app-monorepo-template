import { createTurnstileBotProtection } from '@app/cloudflare'
import type { IBotProtectionPort } from '@app/core'

export const botProtection: IBotProtectionPort =
  createTurnstileBotProtection()
