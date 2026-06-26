'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import {
  DEFAULT_LOGO_SIZE,
  LOGO_ASSET_SRC
} from '@/components/ui/Logo/logo.constant'
import { LOGO } from '@/components/ui/Logo/Logo.styles'
import { useLogo } from '@/components/ui/Logo/useLogo.hook'

export interface ILogoProps {
  brandLabel: string
  size?: number
}

/**
 * Generic brand mark: renders the per-project SVG asset slot when present and
 * falls back to a brandLabel wordmark when the slot is empty.
 */
export const Logo = ({
  brandLabel,
  size = DEFAULT_LOGO_SIZE
}: ILogoProps): JSX.Element => {
  const t = useTranslations('auth.logo')
  const { hasAsset, onAssetError } = useLogo()
  const altLabel = t('label', { name: brandLabel })

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
