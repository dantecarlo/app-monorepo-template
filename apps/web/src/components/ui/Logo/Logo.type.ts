export interface ILogoProps {
  brandLabel: string
  size?: number
}

export interface IUseLogoResult {
  hasAsset: boolean
  onAssetError: () => void
}
