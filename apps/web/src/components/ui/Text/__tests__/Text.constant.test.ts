import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  TEXT_TONE_VARIANTS,
  TEXT_VARIANT_VARIANTS,
  TEXT_WEIGHT_VARIANTS,
  type TextToneType,
  type TextVariantType,
  type TextWeightType
} from '@/components/ui/Text/Text.constant'
import { textVariants } from '@/components/ui/Text/Text.style'
import type { ITextProps } from '@/components/ui/Text/Text.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('Text constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<VariantUnionsType<typeof textVariants>>().toEqualTypeOf<{
      tone: TextToneType
      variant: TextVariantType
      weight: TextWeightType
    }>()
    expectTypeOf<ITextProps['tone']>().toEqualTypeOf<
      TextToneType | undefined
    >()
    expectTypeOf<ITextProps['variant']>().toEqualTypeOf<
      TextVariantType | undefined
    >()
    expectTypeOf<ITextProps['weight']>().toEqualTypeOf<
      TextWeightType | undefined
    >()
    expect(TEXT_TONE_VARIANTS).toEqual(
      Object.keys(textVariants.variants.tone)
    )
    expect(TEXT_VARIANT_VARIANTS).toEqual(
      Object.keys(textVariants.variants.variant)
    )
    expect(TEXT_WEIGHT_VARIANTS).toEqual(
      Object.keys(textVariants.variants.weight)
    )
  })
})
