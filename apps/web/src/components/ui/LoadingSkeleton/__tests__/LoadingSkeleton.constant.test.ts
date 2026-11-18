import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  LOADING_SKELETON_ROUNDED_VARIANTS,
  type LoadingSkeletonRoundedType
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.constant'
import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('LoadingSkeleton constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof loadingSkeletonVariants>
    >().toEqualTypeOf<{
      rounded: LoadingSkeletonRoundedType
    }>()
    expectTypeOf<ILoadingSkeletonProps['rounded']>().toEqualTypeOf<
      LoadingSkeletonRoundedType | undefined
    >()
    expect(LOADING_SKELETON_ROUNDED_VARIANTS).toEqual(
      Object.keys(loadingSkeletonVariants.variants.rounded)
    )
  })
})
