import { fontFamily, fontSize, radius } from '@app/tokens'
import { StyleSheet } from 'react-native'

import {
  STATUS_BADGE_DOT_SIZE,
  STATUS_BADGE_H_PADDING,
  STATUS_BADGE_V_PADDING
} from '@/components/ui/StatusBadge/StatusBadge.constant'

export const STATUS_BADGE_STYLES = StyleSheet.create({
  dot: {
    borderRadius: radius.full,
    height: STATUS_BADGE_DOT_SIZE,
    width: STATUS_BADGE_DOT_SIZE
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  pill: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: STATUS_BADGE_DOT_SIZE,
    paddingHorizontal: STATUS_BADGE_H_PADDING,
    paddingVertical: STATUS_BADGE_V_PADDING
  }
})
