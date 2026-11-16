import { colors, radius, rnShadows } from '@app/tokens'

import {
  KNOB_SIZE,
  TRACK_HEIGHT,
  TRACK_WIDTH
} from '@/components/ui/Toggle/Toggle.constant'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const TOGGLE_STYLES = createThemedStyles({
  build: (palette) => ({
    knob: {
      backgroundColor: palette.knob.off,
      borderRadius: radius.full,
      height: KNOB_SIZE,
      left: 2,
      position: 'absolute',
      top: 2,
      width: KNOB_SIZE,
      ...rnShadows.card
    },
    knobOn: {
      backgroundColor: palette.knob.on
    },
    track: {
      borderRadius: radius.full,
      height: TRACK_HEIGHT,
      justifyContent: 'center',
      overflow: 'hidden',
      width: TRACK_WIDTH
    },
    trackOff: {
      backgroundColor: palette.neutralTint
    }
  })
})

export const GRADIENT_COLORS: [string, string] = [
  colors.accentLight,
  colors.accent
]
