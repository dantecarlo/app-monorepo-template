import leftPad from 'left-pad'
import { z } from 'zod'

export const paddedSchema = z
  .string()
  .transform((value) => leftPad(value, 2))
