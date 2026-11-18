import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  BUTTON_SIZE_VARIANTS,
  BUTTON_VARIANT_VARIANTS,
  type ButtonSizeType,
  type ButtonVariantType
} from '@/components/ui/Button/Button.constant'
import { buttonVariants } from '@/components/ui/Button/Button.style'
import type { IButtonProps } from '@/components/ui/Button/Button.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('Button constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof buttonVariants>
    >().toEqualTypeOf<{
      fullWidth: boolean
      size: ButtonSizeType
      variant: ButtonVariantType
    }>()
    expectTypeOf<IButtonProps['size']>().toEqualTypeOf<
      ButtonSizeType | undefined
    >()
    expectTypeOf<IButtonProps['variant']>().toEqualTypeOf<
      ButtonVariantType | undefined
    >()
    expect(BUTTON_SIZE_VARIANTS).toEqual(
      Object.keys(buttonVariants.variants.size)
    )
    expect(BUTTON_VARIANT_VARIANTS).toEqual(
      Object.keys(buttonVariants.variants.variant)
    )
  })
})
