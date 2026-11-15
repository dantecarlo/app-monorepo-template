import { expect, test } from 'vitest'

import { buildExampleSchema } from '@/validation/buildExampleSchema.schema'
import {
  NOTE_MAX_LENGTH,
  QUANTITY_MAX,
  QUANTITY_MIN
} from '@/validation/validation.constant'

const t = (key: string) => key

test('valid input parses successfully', () => {
  const { exampleSchema } = buildExampleSchema({ t })
  const result = exampleSchema.safeParse({ label: 'Item A', quantity: 10 })
  expect(result.success).toBe(true)
})

test('empty label fails with i18n key as message', () => {
  const { exampleSchema } = buildExampleSchema({ t })
  const result = exampleSchema.safeParse({ label: '', quantity: 10 })
  expect(result.success).toBe(false)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.example.labelRequired')
  }
})

test('label exceeding max length fails with i18n key', () => {
  const { exampleSchema } = buildExampleSchema({ t })
  const longLabel = 'a'.repeat(NOTE_MAX_LENGTH + 1)
  const result = exampleSchema.safeParse({
    label: longLabel,
    quantity: 10
  })
  expect(result.success).toBe(false)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.example.labelTooLong')
  }
})

test('quantity below minimum fails with i18n key', () => {
  const { exampleSchema } = buildExampleSchema({ t })
  const result = exampleSchema.safeParse({
    label: 'Valid',
    quantity: QUANTITY_MIN - 1
  })
  expect(result.success).toBe(false)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.example.quantityMin')
  }
})

test('quantity above maximum fails with i18n key', () => {
  const { exampleSchema } = buildExampleSchema({ t })
  const result = exampleSchema.safeParse({
    label: 'Valid',
    quantity: QUANTITY_MAX + 1
  })
  expect(result.success).toBe(false)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.example.quantityMax')
  }
})

test('messages are driven by the t() function', () => {
  const customT = (key: string) => `TRANSLATED:${key}`
  const { exampleSchema } = buildExampleSchema({ t: customT })
  const result = exampleSchema.safeParse({ label: '', quantity: 10 })
  expect(result.success).toBe(false)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain(
      'TRANSLATED:validation.example.labelRequired'
    )
  }
})
