import type { JSX } from 'react'

import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'

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
