export interface ILogoProps {
  brandLabel: string
  hasAsset?: boolean
  size?: number
}

export interface IUseLogoArgs {
  hasAsset: boolean
}

export interface IUseLogoResult {
  showWordmark: boolean
}
