import type { JSX } from 'react'

import { GoogleGlyph } from '@/components/ui/SocialAuthButton/GoogleGlyph.component'
import {
  SOCIAL_AUTH_GLYPH_SIZE,
  SOCIAL_AUTH_LABEL_CLASS,
  SOCIAL_AUTH_ROOT_CLASS
} from '@/components/ui/SocialAuthButton/SocialAuthButton.constant'

export interface ISocialAuthButtonProps {
  disabled?: boolean
  isLoading?: boolean
  label: string
  loadingLabel: string
  onClick?: () => void
}

/** Glass Google social-auth pill button. */
export const SocialAuthButton = ({
  disabled,
  isLoading = false,
  label,
  loadingLabel,
  onClick
}: ISocialAuthButtonProps): JSX.Element => (
  <button
    className={SOCIAL_AUTH_ROOT_CLASS}
    disabled={disabled ?? isLoading}
    onClick={onClick}
    type="button"
  >
    <GoogleGlyph size={SOCIAL_AUTH_GLYPH_SIZE} />
    <span className={SOCIAL_AUTH_LABEL_CLASS}>
      {isLoading ? loadingLabel : label}
    </span>
  </button>
)
