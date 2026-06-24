import { describe, expect, test } from 'vitest'

import { SettingRow } from '@/components/ui/SettingRow/SettingRow.component'

describe('SettingRow', () => {
  test('is exported as a function', () => {
    expect(typeof SettingRow).toBe('function')
  })
})
