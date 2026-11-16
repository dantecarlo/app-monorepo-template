import { SUPPORTED_LANGUAGES } from '@app/i18n'

import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'

// Blocking inline head script, beside the theme's: the root layout renders
// its document shell statically (Cache Components forbids reading cookies()
// outside <Suspense>), so the shell writes the default language and this
// script replaces it, before first paint, with the supported language the
// NEXT_LOCALE cookie names. The providers keep it in step after a switch
// (useDocumentLanguage). Composed from shared constants so the cookie name
// and the languages never drift.
export const NO_FLASH_LOCALE_SCRIPT = [
  '(function(){try{',
  `var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE_NAME}=([^;]+)/);`,
  `var s=${JSON.stringify(SUPPORTED_LANGUAGES)};`,
  'if(m&&s.indexOf(m[1])>-1){document.documentElement.lang=m[1];}',
  '}catch(e){}})();'
].join('')
