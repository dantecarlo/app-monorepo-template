import { describe, expect, test } from 'vitest'

import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader.component'
import { render, screen } from '@/test/test.helper'

describe('ScreenHeader', () => {
  test('is exported as a function', () => {
    expect(typeof ScreenHeader).toBe('function')
  })

  test('marks its title as a header', () => {
    render(<ScreenHeader backLabel="Back" title="Items" />)

    expect(screen.getByRole('header')).toBe(screen.getByText('Items'))
  })
})
