import type { CSSProperties } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'

export interface ILoadingSkeletonProps extends VariantProps<
  typeof loadingSkeletonVariants
> {
  className?: string
  height?: CSSProperties['height']
  width?: CSSProperties['width']
}
