import { colors, radius, rnShadows } from '@app/tokens'
import { StyleSheet } from 'react-native'

import {
  KNOB_SIZE,
  TRACK_HEIGHT,
  TRACK_WIDTH
} from '@/components/ui/Toggle/Toggle.constant'

export const TOGGLE_STYLES = StyleSheet.create({
  knob: {
    backgroundColor: colors.knob.off,
    borderRadius: radius.full,
    height: KNOB_SIZE,
    left: 2,
    position: 'absolute',
    top: 2,
    width: KNOB_SIZE,
    ...rnShadows.card
  },
  knobOn: {
    backgroundColor: colors.knob.on
  },
  track: {
    borderRadius: radius.full,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    width: TRACK_WIDTH
  },
  trackOff: {
    backgroundColor: colors.neutralTint
  }
})

export const GRADIENT_COLORS: [string, string] = [
  colors.accentLight,
  colors.accent
]
