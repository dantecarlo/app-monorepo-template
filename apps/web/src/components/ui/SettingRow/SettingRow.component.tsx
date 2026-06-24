import type { JSX, ReactNode } from 'react'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  SETTING_ROW_CHEVRON_SIZE,
  SETTING_ROW_INTERACTIVE_CLASS,
  SETTING_ROW_LABEL_CLASS,
  SETTING_ROW_ROOT_CLASS,
  SETTING_ROW_SUBTITLE_CLASS,
  SETTING_ROW_VALUE_CLASS
} from '@/components/ui/SettingRow/SettingRow.constant'

export interface ISettingRowProps {
  control?: ReactNode
  isFirst?: boolean
  label: string
  leading?: ReactNode
  onClick?: () => void
  subtitle?: string
  value?: string
}

/**
 * Settings list row: leading slot + label/subtitle + trailing value/control
 * or chevron when the row is interactive. Pass `control` to override the
 * value/chevron area with a custom element (e.g. Toggle, StatusBadge).
 */
export const SettingRow = ({
  control,
  isFirst = false,
  label,
  leading,
  onClick,
  subtitle,
  value
}: ISettingRowProps): JSX.Element => {
  const rootClass = [
    SETTING_ROW_ROOT_CLASS,
    isFirst ? 'border-t-0' : '',
    onClick !== undefined ? SETTING_ROW_INTERACTIVE_CLASS : ''
  ]
    .join(' ')
    .trim()

  const trailing = (() => {
    if (control !== undefined) return control
    if (value !== undefined)
      return <span className={SETTING_ROW_VALUE_CLASS}>{value}</span>
    if (onClick !== undefined)
      return (
        <Icon
          color="currentColor"
          decorative
          name="chevron-right"
          size={SETTING_ROW_CHEVRON_SIZE}
        />
      )
    return null
  })()

  const inner = (
    <>
      {leading !== undefined && <div className="flex-none">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className={SETTING_ROW_LABEL_CLASS}>{label}</p>
        {subtitle !== undefined && (
          <p className={SETTING_ROW_SUBTITLE_CLASS}>{subtitle}</p>
        )}
      </div>
      {trailing !== null && (
        <div className="flex-none flex items-center">{trailing}</div>
      )}
    </>
  )

  if (onClick !== undefined) {
    return (
      <button className={rootClass} onClick={onClick} type="button">
        {inner}
      </button>
    )
  }

  return <div className={rootClass}>{inner}</div>
}
