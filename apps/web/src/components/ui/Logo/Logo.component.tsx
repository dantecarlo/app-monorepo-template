'use client'

import type { JSX } from 'react'

import { Image } from '@/components/ui/Image/Image.component'
import {
  DEFAULT_LOGO_SIZE,
  LOGO_ASSET_SRC
} from '@/components/ui/Logo/Logo.constant'
import { LOGO } from '@/components/ui/Logo/Logo.style'
import type { ILogoProps } from '@/components/ui/Logo/Logo.type'
import { useLogo } from '@/components/ui/Logo/useLogo.hook'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

/**
 * Generic brand mark: renders the per-project SVG asset slot when present and
 * falls back to a brandLabel wordmark when the slot is empty.
 */
export const Logo = ({
  brandLabel,
  size = DEFAULT_LOGO_SIZE
}: ILogoProps): JSX.Element => {
  const { t } = useAppTranslator()
  const { hasAsset, onAssetError } = useLogo()
  const altLabel = t('auth.logo.label', { name: brandLabel })

  if (hasAsset) {
    return (
      <Image
        alt={altLabel}
        className={LOGO.ASSET}
        height={size}
        onError={onAssetError}
        priority
        src={LOGO_ASSET_SRC}
        width={size}
      />
    )
  }

  return (
    <span
      aria-label={altLabel}
      className={LOGO.WORDMARK}
      role="img"
      style={{ height: size }}
    >
      {brandLabel}
    </span>
  )
}
