import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  CHIP_VARIANT_VARIANTS,
  type ChipVariantType
} from '@/components/ui/Chip/Chip.constant'
import { chipVariants } from '@/components/ui/Chip/Chip.style'
import type { IChipProps } from '@/components/ui/Chip/Chip.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('Chip constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<VariantUnionsType<typeof chipVariants>>().toEqualTypeOf<{
      variant: ChipVariantType
    }>()
    expectTypeOf<IChipProps['variant']>().toEqualTypeOf<
      ChipVariantType | undefined
    >()
    expect(CHIP_VARIANT_VARIANTS).toEqual(
      Object.keys(chipVariants.variants.variant)
    )
  })
})
