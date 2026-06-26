import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { useLogo } from './useLogo.hook'

describe('useLogo', () => {
  test('starts assuming the asset slot resolves', () => {
    const { result } = renderHook(() => useLogo())
    expect(result.current.hasAsset).toBe(true)
  })

  test('falls back when the asset fails to load', () => {
    const { result } = renderHook(() => useLogo())
    act(() => result.current.onAssetError())
    expect(result.current.hasAsset).toBe(false)
  })
})
