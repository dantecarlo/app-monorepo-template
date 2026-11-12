import type {
  IUseLogoArgs,
  IUseLogoResult
} from '@/components/ui/Logo/Logo.type'

// Decides which representation the Logo renders: the per-project SVG asset
// placeholder when present, otherwise the brandLabel wordmark fallback.
export const useLogo = ({ hasAsset }: IUseLogoArgs): IUseLogoResult => ({
  showWordmark: !hasAsset
})
