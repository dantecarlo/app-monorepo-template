import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { getRequestConfig } from 'next-intl/server'

const I18N_TIME_ZONE = 'UTC'

export default getRequestConfig(async () => {
  return {
    locale: DEFAULT_LANGUAGE,
    messages: resources[DEFAULT_LANGUAGE].translation,
    timeZone: I18N_TIME_ZONE
  }
})
