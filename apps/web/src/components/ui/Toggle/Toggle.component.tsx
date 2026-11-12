import type { JSX } from 'react'

import { TOGGLE } from '@/components/ui/Toggle/Toggle.constant'
import type { IToggleProps } from '@/components/ui/Toggle/Toggle.type'

export const Toggle = ({
  accessibilityLabel,
  disabled,
  onValueChange,
  value
}: IToggleProps): JSX.Element => (
  <button
    aria-checked={value}
    aria-label={accessibilityLabel}
    className={[
      TOGGLE.TRACK_BASE,
      value ? TOGGLE.TRACK_ON : TOGGLE.TRACK_OFF
    ].join(' ')}
    disabled={disabled}
    onClick={() => onValueChange(!value)}
    role="switch"
    type="button"
  >
    <span
      className={[
        TOGGLE.KNOB_BASE,
        value ? TOGGLE.KNOB_ON : TOGGLE.KNOB_OFF
      ].join(' ')}
    />
  </button>
)
