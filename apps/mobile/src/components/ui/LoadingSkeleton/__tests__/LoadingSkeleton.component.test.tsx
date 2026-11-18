import { LanguageEnum, resources } from '@app/i18n'
import { ThemeEnum } from '@app/tokens'
import { describe, expect, test, vi } from 'vitest'

// The shimmer runs on the native UI thread; here it is a plain view.
vi.mock('react-native-reanimated', () => ({
  default: { View: ({ children }: { children?: unknown }) => children }
}))

vi.mock('@/components/ui/LoadingSkeleton/useShimmer.hook', () => ({
  useShimmer: () => ({ animatedStyle: {} })
}))

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'
import {
  ROUNDED_BY_VARIANT,
  SKELETON_SHIMMER_END,
  SKELETON_SHIMMER_MID,
  SKELETON_SHIMMER_START
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

const SKELETON_HEIGHT = 16

// The mobile tests run without the DOM lib: this is the part of a rendered
// host element they read.
interface IHostNode {
  firstElementChild: IHostNode | null
  getAttribute: (name: string) => string | null
}

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

  test('sweeps its shimmer gradient across the skeleton', () => {
    renderWithI18n({
      language: LanguageEnum.EN,
      ui: <LoadingSkeleton height={SKELETON_HEIGHT} />
    })
    const skeleton = screen.getByLabelText(
      resources[LanguageEnum.EN].translation.common.loading
    ) as unknown as IHostNode

    expect(
      JSON.parse(
        skeleton.firstElementChild?.getAttribute('data-colors') ?? '[]'
      )
    ).toEqual([
      SKELETON_SHIMMER_START,
      SKELETON_SHIMMER_MID[ThemeEnum.DARK],
      SKELETON_SHIMMER_END
    ])
  })
})
