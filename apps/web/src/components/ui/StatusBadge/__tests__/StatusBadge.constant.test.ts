import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  STATUS_BADGE_TONE_VARIANTS,
  type StatusBadgeToneType
} from '@/components/ui/StatusBadge/StatusBadge.constant'
import {
  statusBadgeDotVariants,
  statusBadgeVariants
} from '@/components/ui/StatusBadge/StatusBadge.style'
import type { IStatusBadgeProps } from '@/components/ui/StatusBadge/StatusBadge.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('StatusBadge constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof statusBadgeDotVariants>
    >().toEqualTypeOf<{
      tone: StatusBadgeToneType
    }>()
    expectTypeOf<
      VariantUnionsType<typeof statusBadgeVariants>
    >().toEqualTypeOf<{
      tone: StatusBadgeToneType
    }>()
    expectTypeOf<IStatusBadgeProps['tone']>().toEqualTypeOf<
      StatusBadgeToneType | undefined
    >()
    expect(STATUS_BADGE_TONE_VARIANTS).toEqual(
      Object.keys(statusBadgeDotVariants.variants.tone)
    )
    expect(STATUS_BADGE_TONE_VARIANTS).toEqual(
      Object.keys(statusBadgeVariants.variants.tone)
    )
  })
})
