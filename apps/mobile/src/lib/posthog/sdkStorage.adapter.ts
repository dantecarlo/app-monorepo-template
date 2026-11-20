import { File, Paths } from 'expo-file-system'

import { WEB_PLATFORM } from '@/lib/posthog/posthogClient.constant'
import { SDK_STORAGE_FILES } from '@/lib/posthog/sdkStorage.constant'
import { keyValueStorage } from '@/lib/storage'

// expo-file-system runs on a native platform only; posthog-react-native
// does not load it in a web bundle either.
const IS_NATIVE = process.env.EXPO_OS !== WEB_PLATFORM

const removeFile = ({ name }: { name: string }): void => {
  try {
    const file = new File(Paths.document, name)
    if (file.exists) file.delete()
  } catch {
    // A file the system will not delete stays; the launch goes on.
  }
}

/**
 * Removes what posthog-react-native kept on the device when it persisted on
 * its own, as it does under `granted`: its files in the document directory
 * on a native platform, and the keys of the same names in the device's
 * key-value storage, where it keeps them in a web bundle. Every other value
 * stays, and nothing rejects.
 */
export const removeSdkStorage = async (): Promise<void> => {
  if (IS_NATIVE) SDK_STORAGE_FILES.forEach((name) => removeFile({ name }))
  await Promise.allSettled(
    SDK_STORAGE_FILES.map((key) => keyValueStorage.removeItem({ key }))
  )
}
