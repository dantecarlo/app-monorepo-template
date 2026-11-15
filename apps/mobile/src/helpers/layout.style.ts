// Shared layout styles of the mobile app: positioning only. A screen composes
// these; the look of what it places lives in a component (AGENTS.md § Styling
// lives in the components).

import { spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const LAYOUT = StyleSheet.create({
  contentArea: {
    flex: 1
  },
  maxWidth: {
    alignSelf: 'center' as const,
    maxWidth: 428,
    width: '100%'
  },
  screenPadding: {
    paddingHorizontal: spacing.lg
  },
  sectionGap: {
    gap: spacing.lg
  }
})
