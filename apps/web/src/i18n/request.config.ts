import { getRequestConfig } from 'next-intl/server'

import { resolveRequestConfig } from '@/i18n/requestConfig.helper'

// next-intl's request config, which the Next plugin loads by path: the
// resolution, cookie first, lives in resolveRequestConfig, beside it.
export default getRequestConfig(resolveRequestConfig)
