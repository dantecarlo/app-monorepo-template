import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  ICON_BUTTON_VARIANT_VARIANTS,
  type IconButtonVariantType
} from '@/components/ui/IconButton/IconButton.constant'
import { iconButtonVariants } from '@/components/ui/IconButton/IconButton.style'
import type { IIconButtonProps } from '@/components/ui/IconButton/IconButton.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('IconButton constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof iconButtonVariants>
    >().toEqualTypeOf<{
      variant: IconButtonVariantType
    }>()
    expectTypeOf<IIconButtonProps['variant']>().toEqualTypeOf<
      IconButtonVariantType | undefined
    >()
    expect(ICON_BUTTON_VARIANT_VARIANTS).toEqual(
      Object.keys(iconButtonVariants.variants.variant)
    )
  })
})
