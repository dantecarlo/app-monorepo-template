import { useRouter } from 'expo-router'
import { Text } from 'react-native'

export const Inbox = () => {
  const router = useRouter()

  return <Text onPress={router.back}>Inbox</Text>
}
