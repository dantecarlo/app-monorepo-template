import { describe, expect, test } from 'vitest'

import { SocialAuthButton } from '@/components/ui/SocialAuthButton/SocialAuthButton.component'

describe('SocialAuthButton', () => {
  test('is exported as a function', () => {
    expect(typeof SocialAuthButton).toBe('function')
  })
})
