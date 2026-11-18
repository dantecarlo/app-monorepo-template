import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  AVATAR_SIZES,
  AVATAR_VARIANT_VARIANTS,
  type AvatarSizeType,
  type AvatarVariantType
} from '@/components/ui/Avatar/Avatar.constant'
import { avatarVariants } from '@/components/ui/Avatar/Avatar.style'
import type { IAvatarProps } from '@/components/ui/Avatar/Avatar.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('Avatar constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof avatarVariants>
    >().toEqualTypeOf<{
      size: AvatarSizeType
      variant: AvatarVariantType
    }>()
    expectTypeOf<IAvatarProps['size']>().toEqualTypeOf<
      AvatarSizeType | undefined
    >()
    expectTypeOf<IAvatarProps['variant']>().toEqualTypeOf<
      AvatarVariantType | undefined
    >()
    expect(AVATAR_SIZES.map(String)).toEqual(
      Object.keys(avatarVariants.variants.size)
    )
    expect(AVATAR_VARIANT_VARIANTS).toEqual(
      Object.keys(avatarVariants.variants.variant)
    )
  })
})
