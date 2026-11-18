import AsyncStorage from '@react-native-async-storage/async-storage'
import { beforeEach, expect, test } from 'vitest'

import { keyValueStorage } from '@/lib/storage/keyValueStorage.adapter'

const KEY = 'theme'

beforeEach(async () => {
  await AsyncStorage.clear()
})

test('writes, reads and removes a value on the device storage', async () => {
  await keyValueStorage.setItem({ key: KEY, value: 'dark' })

  expect(await AsyncStorage.getItem(KEY)).toBe('dark')
  expect(await keyValueStorage.getItem({ key: KEY })).toBe('dark')

  await keyValueStorage.removeItem({ key: KEY })

  expect(await AsyncStorage.getItem(KEY)).toBeNull()
})

test('reads null for a key the device storage does not hold', async () => {
  expect(await keyValueStorage.getItem({ key: KEY })).toBeNull()
})
