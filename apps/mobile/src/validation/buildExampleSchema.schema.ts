import { z } from 'zod'

import {
  NOTE_MAX_LENGTH,
  QUANTITY_MAX,
  QUANTITY_MIN
} from '@/validation/validation.constant'

type TranslateFnType = (key: string) => string

export interface IBuildExampleSchemaParams {
  t: TranslateFnType
}

export const buildExampleSchema = ({ t }: IBuildExampleSchemaParams) => {
  const exampleSchema = z.object({
    label: z
      .string()
      .min(1, t('validation.example.labelRequired'))
      .max(NOTE_MAX_LENGTH, t('validation.example.labelTooLong')),
    quantity: z
      .number()
      .int()
      .min(QUANTITY_MIN, t('validation.example.quantityMin'))
      .max(QUANTITY_MAX, t('validation.example.quantityMax'))
  })

  return { exampleSchema }
}

export type ExampleFormValuesType = z.infer<
  ReturnType<typeof buildExampleSchema>['exampleSchema']
>
