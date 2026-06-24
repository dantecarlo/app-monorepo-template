import { colors } from '@app/tokens'
import { StyleSheet } from 'react-native'

const STATUS_DOT_SIZE = 7
const STATUS_DOT_BORDER_RADIUS = 4
const PILL_BORDER_RADIUS = 9999
const PILL_PADDING_HORIZONTAL = 11
const PILL_PADDING_VERTICAL = 5
const PILL_GAP = 6
const HEADER_MARGIN_BOTTOM = 12
const STATS_MARGIN_TOP = 4
const SUBROW_MARGIN_TOP = 12
const SUBROW_GAP = 8

export const STATS_CARD_STYLES = StyleSheet.create({
  activePill: {
    backgroundColor: colors.accentTint,
    borderRadius: PILL_BORDER_RADIUS,
    paddingHorizontal: PILL_PADDING_HORIZONTAL,
    paddingVertical: PILL_PADDING_VERTICAL
  },
  activePillText: {
    color: colors.accent,
    fontWeight: '500'
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: HEADER_MARGIN_BOTTOM
  },
  liveDot: {
    backgroundColor: colors.success,
    borderRadius: STATUS_DOT_BORDER_RADIUS,
    height: STATUS_DOT_SIZE,
    width: STATUS_DOT_SIZE
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: colors.successTint,
    borderRadius: PILL_BORDER_RADIUS,
    flexDirection: 'row',
    gap: PILL_GAP,
    paddingHorizontal: PILL_PADDING_HORIZONTAL,
    paddingVertical: PILL_PADDING_VERTICAL
  },
  livePillText: {
    color: colors.success,
    fontWeight: '500'
  },
  statsLabel: {
    marginTop: STATS_MARGIN_TOP
  },
  subRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SUBROW_GAP,
    marginTop: SUBROW_MARGIN_TOP
  }
})
