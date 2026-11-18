import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  MODAL_SIZE_VARIANTS,
  type ModalSizeType
} from '@/components/ui/Modal/Modal.constant'
import { modalPanelVariants } from '@/components/ui/Modal/Modal.style'
import type { IModalProps } from '@/components/ui/Modal/Modal.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('Modal constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof modalPanelVariants>
    >().toEqualTypeOf<{
      size: ModalSizeType
    }>()
    expectTypeOf<IModalProps['size']>().toEqualTypeOf<
      ModalSizeType | undefined
    >()
    expect(MODAL_SIZE_VARIANTS).toEqual(
      Object.keys(modalPanelVariants.variants.size)
    )
  })
})
