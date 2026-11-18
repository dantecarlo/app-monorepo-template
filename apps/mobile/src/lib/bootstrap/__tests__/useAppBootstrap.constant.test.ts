import { describe, expect, test, vi } from 'vitest'

// The font files load only in a native or web build, so each face is its
// name.
vi.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium'
}))
vi.mock('@expo-google-fonts/montserrat', () => ({
  Montserrat_400Regular: 'Montserrat_400Regular',
  Montserrat_500Medium: 'Montserrat_500Medium',
  Montserrat_600SemiBold: 'Montserrat_600SemiBold',
  Montserrat_700Bold: 'Montserrat_700Bold',
  Montserrat_800ExtraBold: 'Montserrat_800ExtraBold'
}))

import { APP_FONTS } from '@/lib/bootstrap/useAppBootstrap.constant'

describe('APP_FONTS', () => {
  test('holds the Inter and Montserrat faces the app uses', () => {
    expect(APP_FONTS).toEqual({
      Inter_400Regular: 'Inter_400Regular',
      Inter_500Medium: 'Inter_500Medium',
      Montserrat_400Regular: 'Montserrat_400Regular',
      Montserrat_500Medium: 'Montserrat_500Medium',
      Montserrat_600SemiBold: 'Montserrat_600SemiBold',
      Montserrat_700Bold: 'Montserrat_700Bold',
      Montserrat_800ExtraBold: 'Montserrat_800ExtraBold'
    })
  })
})
