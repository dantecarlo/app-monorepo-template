'use client'

import { useCallback, useState } from 'react'

export interface IUseLogoResult {
  hasAsset: boolean
  onAssetError: () => void
}

// Tracks whether the project asset slot resolved. When the <img> fails to load
// (no per-project logo dropped in), it flips to the wordmark fallback.
export const useLogo = (): IUseLogoResult => {
  const [hasAsset, setHasAsset] = useState(true)

  const onAssetError = useCallback(() => {
    setHasAsset(false)
  }, [])

  return { hasAsset, onAssetError }
}
