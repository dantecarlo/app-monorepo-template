import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

// The shimmer runs on the native UI thread; here it is a plain view.
vi.mock('react-native-reanimated', () => ({
  default: { View: ({ children }: { children?: unknown }) => children }
}))

vi.mock('@/components/ui/LoadingSkeleton/useShimmer.hook', () => ({
  useShimmer: () => ({ animatedStyle: {} })
}))

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'
import { ROUNDED_BY_VARIANT } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

const SKELETON_HEIGHT = 16

describe('LoadingSkeleton', () => {
  test('ROUNDED_BY_VARIANT covers all preset keys', () => {
    expect(Object.keys(ROUNDED_BY_VARIANT)).toEqual(
      expect.arrayContaining(['sm', 'md', 'lg', 'full'])
    )
  })

  test('labels the skeleton in the active language', () => {
    renderWithI18n({
      language: LanguageEnum.ES,
      ui: <LoadingSkeleton height={SKELETON_HEIGHT} />
    })

    expect(
      screen.getByLabelText(
        resources[LanguageEnum.ES].translation.common.loading
      )
    ).toBeTruthy()
  })
})
