import type { CSSProperties, JSX } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'

export interface ILoadingSkeletonProps extends VariantProps<
  typeof loadingSkeletonVariants
> {
  className?: string
  height?: CSSProperties['height']
  width?: CSSProperties['width']
}

export const LoadingSkeleton = ({
  className,
  height,
  rounded,
  width
}: ILoadingSkeletonProps): JSX.Element => {
  const { root, shimmer } = loadingSkeletonVariants({ rounded })

  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={root({ class: className })}
      role="status"
      style={{ height, width }}
    >
      <div className={shimmer()} />
    </div>
  )
}
