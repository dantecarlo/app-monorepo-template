import { colors } from '@app/tokens'
import { StyleSheet } from 'react-native'

const HEADER_GAP = 12
const LIST_PADDING_BOTTOM = 8
const LIST_PADDING_HORIZONTAL = 20
const LOADING_PADDING_VERTICAL = 24
const EMPTY_PADDING_VERTICAL = 24

export const ITEMS_LIST_CARD_STYLES = StyleSheet.create({
  cardHeader: {
    gap: HEADER_GAP
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  emptyText: {
    color: colors.text.tertiary,
    paddingVertical: EMPTY_PADDING_VERTICAL,
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: LIST_PADDING_BOTTOM,
    paddingHorizontal: LIST_PADDING_HORIZONTAL
  },
  loadingIndicator: {
    paddingVertical: LOADING_PADDING_VERTICAL
  }
})
