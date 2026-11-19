import { Text as NativeText } from 'react-native'

export const Text = ({ children }: { children: string }) => (
  <NativeText>{children}</NativeText>
)
