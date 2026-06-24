import { Platform } from 'react-native'

export const NAV_BAR_BLUR_INTENSITY = 60

export const NAV_BAR_ICON_SIZE = 22

export const NAV_BAR_BOTTOM_OFFSET = Platform.select({
  android: 16,
  default: 24,
  ios: 24
})

export const NAV_BAR_PRESSED_OPACITY = 0.6
