import { describe, expect, test } from 'vitest'

import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'
import { Text } from '@/components/ui/Text/Text.component'
import { renderWithI18n } from '@/test/i18n.helper'
import { screen } from '@/test/test.helper'

describe('AuthShell', () => {
  test('is exported as a function', () => {
    expect(typeof AuthShell).toBe('function')
  })

  test('marks its title as a header', () => {
    renderWithI18n({
      ui: (
        <AuthShell brandLabel="Acme" subtitle="Welcome" title="Sign in">
          <Text>Form</Text>
        </AuthShell>
      )
    })

    expect(screen.getByRole('header')).toBe(screen.getByText('Sign in'))
  })
})
