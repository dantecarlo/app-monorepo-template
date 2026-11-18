import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  CONFIRM_DIALOG_TONE_VARIANTS,
  type ConfirmDialogToneType
} from '@/components/ui/ConfirmDialog/ConfirmDialog.constant'
import { confirmButtonVariants } from '@/components/ui/ConfirmDialog/ConfirmDialog.style'
import type { IConfirmDialogProps } from '@/components/ui/ConfirmDialog/ConfirmDialog.type'
import type { VariantUnionsType } from '@/components/ui/variants.helper'

describe('ConfirmDialog constants', () => {
  test('its variant unions are the variants of its tv config', () => {
    expectTypeOf<
      VariantUnionsType<typeof confirmButtonVariants>
    >().toEqualTypeOf<{
      tone: ConfirmDialogToneType
    }>()
    expectTypeOf<IConfirmDialogProps['tone']>().toEqualTypeOf<
      ConfirmDialogToneType | undefined
    >()
    expect(CONFIRM_DIALOG_TONE_VARIANTS).toEqual(
      Object.keys(confirmButtonVariants.variants.tone)
    )
  })
})
