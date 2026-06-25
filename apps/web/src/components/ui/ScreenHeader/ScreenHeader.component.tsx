import type { JSX } from 'react'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import { IconButton } from '@/components/ui/IconButton/IconButton.component'
import {
  SCREEN_HEADER_ROOT_CLASS,
  SCREEN_HEADER_SLOT_CLASS,
  SCREEN_HEADER_TITLE_CLASS
} from '@/components/ui/ScreenHeader/ScreenHeader.constant'

export interface IScreenHeaderProps {
  actionLabel?: string
  actionName?: IconNameType
  backLabel: string
  onAction?: () => void
  onBack?: () => void
  title: string
}

/**
 * Fixed header with symmetric slots: back button (left) + title (center) +
 * optional trailing action (right). The equal-width slots keep the title
 * centred regardless of which side has a control.
 */
export const ScreenHeader = ({
  actionLabel,
  actionName,
  backLabel,
  onAction,
  onBack,
  title
}: IScreenHeaderProps): JSX.Element => {
  const hasAction =
    actionName !== undefined &&
    actionLabel !== undefined &&
    onAction !== undefined

  return (
    <header className={SCREEN_HEADER_ROOT_CLASS}>
      <div className={SCREEN_HEADER_SLOT_CLASS}>
        {onBack !== undefined && (
          <IconButton
            accessibilityLabel={backLabel}
            name="chevron-left"
            onClick={onBack}
          />
        )}
      </div>

      <h1 className={SCREEN_HEADER_TITLE_CLASS}>{title}</h1>

      <div className={SCREEN_HEADER_SLOT_CLASS}>
        {hasAction ? (
          <IconButton
            accessibilityLabel={actionLabel}
            name={actionName}
            onClick={onAction}
          />
        ) : null}
      </div>
    </header>
  )
}
