export interface IUseLogoArgs {
  hasAsset: boolean
}

export interface IUseLogoResult {
  showWordmark: boolean
}

// Decides which representation the Logo renders: the per-project SVG asset
// placeholder when present, otherwise the brandLabel wordmark fallback.
export const useLogo = ({ hasAsset }: IUseLogoArgs): IUseLogoResult => ({
  showWordmark: !hasAsset
})
