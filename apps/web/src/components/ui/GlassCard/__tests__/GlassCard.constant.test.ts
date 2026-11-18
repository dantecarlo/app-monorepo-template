import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  GLASS_CARD_PADDING_VARIANTS,
  GLASS_CARD_RADIUS_VARIANTS,
  type GlassCardPaddingType,
  type GlassCardRadiusType
} from '@/components/ui/GlassCard/GlassCard.constant'
import { glassCardVariants } from '@/components/ui/GlassCard/GlassCard.style'
import type { IGlassCardProps } from '@/components/ui/GlassCard/GlassCard.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('GlassCard constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof glassCardVariants>
    >().toEqualTypeOf<{
      padding: GlassCardPaddingType
      radius: GlassCardRadiusType
    }>()
    expectTypeOf<IGlassCardProps['padding']>().toEqualTypeOf<
      GlassCardPaddingType | undefined
    >()
    expectTypeOf<IGlassCardProps['radius']>().toEqualTypeOf<
      GlassCardRadiusType | undefined
    >()
    expect(GLASS_CARD_PADDING_VARIANTS).toEqual(
      Object.keys(glassCardVariants.variants.padding)
    )
    expect(GLASS_CARD_RADIUS_VARIANTS).toEqual(
      Object.keys(glassCardVariants.variants.radius)
    )
  })
})
