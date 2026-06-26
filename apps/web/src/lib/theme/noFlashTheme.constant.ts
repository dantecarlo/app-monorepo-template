import { ThemeEnum } from '@app/tokens'

import {
  THEME_ATTRIBUTE,
  THEME_COOKIE_NAME
} from '@/lib/theme/theme.constant'

// Blocking inline head script — the single source of the resolved theme on
// first paint. The root layout renders statically (Cache Components forbids
// reading cookies() there, as it would make every page dynamic), so this
// script resolves the theme before paint with no flash:
//   1. honor the NEXT_THEME cookie when present (the user's saved choice),
//   2. otherwise fall back to prefers-color-scheme.
// It sets data-theme on <html>; useThemeBootstrap then adopts it into the
// store. Tiny, dependency-free, composed from shared constants so
// cookie/attribute names never drift.
export const NO_FLASH_THEME_SCRIPT = [
  '(function(){try{',
  `var m=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]+)/);`,
  'var c=m&&m[1];',
  `var t=(c==='${ThemeEnum.LIGHT}'||c==='${ThemeEnum.DARK}')?c:`,
  `(window.matchMedia('(prefers-color-scheme: light)').matches?'${ThemeEnum.LIGHT}':'${ThemeEnum.DARK}');`,
  `document.documentElement.setAttribute('${THEME_ATTRIBUTE}',t);`,
  '}catch(e){}})();'
].join('')
